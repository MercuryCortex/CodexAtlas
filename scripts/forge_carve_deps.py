#!/usr/bin/env python3
"""
forge_carve_deps.py — AST-based dep scanner for closure carves.

Filed 2026-05-25 as Phase 23.1-retry-prereq #2 per the lesson
from the failed Phase 23.1 carve series (commits f580070..288c9bc,
reverted in 3c294e2). The regex-based dep auto-detection I used
missed forge-scope identifiers (BUCKET_ORDER, PARAM_DEFAULTS,
modemod, fmtYear, etc.); the carved modules threw silently inside
the async bootstrap IIFE and attachInteractions never ran.

This tool replaces the regex heuristic with a real esprima AST walk.

USAGE:
    python3 scripts/forge_carve_deps.py <file.js> <function-name>

OUTPUT:
    JSON to stdout with two arrays:
      - "deps": free identifiers referenced inside the function body
        that are NOT declared inside it (these MUST be passed via
        the deps object on the lift-and-shift carve).
      - "declared_inside": identifiers declared inside the function
        (params + var/let/const/function declarations + destructure
        targets + catch-params) — for verification.

EXAMPLE:
    $ python3 scripts/forge_carve_deps.py src/js/views/forge.js wireLegend
    {
      "deps": ["local", "recomputeFocus", "BUCKET_ORDER", "PARAM_DEFAULTS"],
      "declared_inside": ["BUCKETS", "TIERS", "rowsHtml", ...]
    }

DEPENDENCY:
    pip3 install esprima

DESIGN NOTES:
    - Walks ALL identifier-bearing nodes in the AST.
    - Tracks scope via param introductions, var/let/const declarations,
      function declarations, catch-clauses, and destructure patterns.
    - Excludes MemberExpression `.property` nodes (only the `object`
      is a real free reference).
    - Excludes JS builtins (document, window, Math, console, etc.) +
      project-internal globals that legitimately live at file-top.
    - Output is sorted + deduplicated for stable comparison.
"""
import json
import sys

try:
    import esprima
except ImportError:
    print("ERROR: esprima not installed. Run: pip3 install esprima", file=sys.stderr)
    sys.exit(1)

# Identifiers that are safe to reference without being a "dep" —
# JS builtins + browser globals + project-internal symbols that
# legitimately live in module-top scope (loaded via <script> before
# forge.js) and forge.js's own file-top symbols we KNOW are safe.
SAFE_GLOBALS = {
    # JS builtins
    'undefined', 'null', 'true', 'false', 'NaN', 'Infinity',
    'Math', 'Array', 'Object', 'String', 'Number', 'Boolean',
    'Date', 'JSON', 'RegExp', 'Error', 'TypeError', 'RangeError',
    'Set', 'Map', 'WeakSet', 'WeakMap', 'Promise', 'Symbol',
    'parseInt', 'parseFloat', 'isFinite', 'isNaN', 'encodeURIComponent',
    'decodeURIComponent', 'encodeURI', 'decodeURI',
    # Browser globals
    'window', 'document', 'console', 'navigator', 'location', 'history',
    'localStorage', 'sessionStorage', 'fetch', 'URL', 'URLSearchParams',
    'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval',
    'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback',
    'performance', 'ResizeObserver', 'IntersectionObserver', 'MutationObserver',
    'Event', 'CustomEvent', 'PointerEvent', 'WheelEvent', 'KeyboardEvent',
    'MouseEvent', 'TouchEvent', 'EventTarget',
    'HTMLElement', 'HTMLCanvasElement', 'HTMLInputElement', 'HTMLImageElement',
    'Image', 'Audio', 'XMLHttpRequest', 'FormData', 'Blob', 'File', 'FileReader',
    'getComputedStyle', 'matchMedia',
    'Element', 'Node', 'NodeFilter', 'Range', 'Selection',
    'globalThis', 'self', 'top', 'parent', 'frames',
    'crypto', 'atob', 'btoa',
    # NOTE: previous versions whitelisted `gpu`, `glyphmod`, `modemod`,
    # `edgemod` here on the assumption they were window globals. They are
    # NOT — they're forge.js-scope aliases (e.g. `const modemod =
    # window.AtlasEngineMode`). Any carved module referencing them by the
    # alias name will fail with ReferenceError. Removed from this list so
    # the scanner flags them as deps (forcing carvers to either pass them
    # explicitly or use the underlying window global directly). Discovered
    # 2026-05-25 NIGHT when install-public-api.js threw on first
    # public-API call due to bare `modemod` usage.
    # Symbols used in JSON-style data + frequently in templates
    'arguments', 'this',
    # Function-special names esprima may emit
    'super',
}

def _collect_declared(node, declared):
    """Recursively collect every name declared as a local in this scope."""
    if node is None: return
    t = node.type if hasattr(node, 'type') else None

    # Skip into nested function scopes — they have their own scope.
    # (But we DO want the outer function's params + locals.)
    if t in ('FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'):
        # If this is a function-EXPRESSION assigned inline (not the root
        # we're scanning), its body is a nested scope; we don't traverse it.
        # But we DO need its NAME if it's a FunctionDeclaration (hoisted).
        if t == 'FunctionDeclaration' and node.id:
            declared.add(node.id.name)
        return  # don't descend

    # var/let/const declarations
    if t == 'VariableDeclarator':
        _collect_pattern_names(node.id, declared)
    # CatchClause: catch (e) { ... }
    if t == 'CatchClause' and node.param:
        _collect_pattern_names(node.param, declared)

    # Recurse into children
    if hasattr(node, '__dict__'):
        for v in node.__dict__.values():
            if v is None: continue
            if isinstance(v, list):
                for item in v:
                    if hasattr(item, 'type'): _collect_declared(item, declared)
            elif hasattr(v, 'type'):
                _collect_declared(v, declared)

def _collect_pattern_names(pat, declared):
    """Handle destructuring + identifier patterns in var/let/const + params."""
    if pat is None: return
    t = pat.type if hasattr(pat, 'type') else None
    if t == 'Identifier':
        declared.add(pat.name)
    elif t == 'ObjectPattern':
        for p in (pat.properties or []):
            # Property has .key + .value; in destructure {a: x, b}, value is what's bound
            if hasattr(p, 'value') and p.value:
                _collect_pattern_names(p.value, declared)
            elif hasattr(p, 'argument') and p.argument:  # rest
                _collect_pattern_names(p.argument, declared)
    elif t == 'ArrayPattern':
        for e in (pat.elements or []):
            if e: _collect_pattern_names(e, declared)
    elif t == 'AssignmentPattern':  # default-value e.g. (x = 1) =>
        _collect_pattern_names(pat.left, declared)
    elif t == 'RestElement':
        _collect_pattern_names(pat.argument, declared)

def _collect_function_locals(fn_node, declared):
    """Given a Function* node, collect its params + body-local declarations."""
    # Params
    for p in (fn_node.params or []):
        _collect_pattern_names(p, declared)
    # Body declarations (var/let/const/function/catch)
    if fn_node.body:
        if fn_node.body.type == 'BlockStatement':
            for stmt in fn_node.body.body or []:
                _collect_declared(stmt, declared)
        else:
            _collect_declared(fn_node.body, declared)

def _collect_free_identifiers(node, declared, free):
    """Walk AST collecting Identifier refs that aren't declared + aren't .property."""
    if node is None: return
    t = node.type if hasattr(node, 'type') else None

    # Don't descend into nested function scopes — their free refs are
    # their own concern.
    if t in ('FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'):
        # But we DO need to collect its params + body declarations into
        # this scope IF it's a nested arrow that closes over our scope?
        # Actually — wait — for our use case (deps OF the target function),
        # nested functions BENEFIT from the same outer scope. Their free
        # refs are ALSO our deps. So we DO descend, but we add their
        # params + locals to a child `declared` set.
        nested_declared = set(declared)
        _collect_function_locals(node, nested_declared)
        if node.body and node.body.type == 'BlockStatement':
            for stmt in node.body.body or []:
                _collect_free_identifiers(stmt, nested_declared, free)
        elif node.body:
            _collect_free_identifiers(node.body, nested_declared, free)
        return

    # MemberExpression: obj.prop — `prop` is NOT a free ref (it's a key),
    # but `obj` IS. For computed (obj[prop]), prop IS a free ref.
    if t == 'MemberExpression':
        _collect_free_identifiers(node.object, declared, free)
        if node.computed:
            _collect_free_identifiers(node.property, declared, free)
        # Skip the property identifier when not computed
        return

    # ObjectExpression: { key: value } — shorthand `{ x }` produces a Property
    # with key=x, value=x, shorthand=true. In that case, x IS a free ref.
    if t == 'Property':
        # In an object expression context, the key is just a name; not a ref
        # UNLESS it's shorthand (the key IS the value).
        # In a destructure pattern, this branch shouldn't fire (those go via
        # _collect_pattern_names).
        if getattr(node, 'shorthand', False):
            # The value is what's referenced
            _collect_free_identifiers(node.value, declared, free)
        else:
            # Don't visit the key (it's just a label); visit the value
            _collect_free_identifiers(node.value, declared, free)
        return

    # Identifier: this is the moment of truth
    if t == 'Identifier':
        name = node.name
        if name not in declared and name not in SAFE_GLOBALS:
            free.add(name)
        return

    # Recurse generically
    if hasattr(node, '__dict__'):
        for v in node.__dict__.values():
            if v is None: continue
            if isinstance(v, list):
                for item in v:
                    if hasattr(item, 'type'): _collect_free_identifiers(item, declared, free)
            elif hasattr(v, 'type'):
                _collect_free_identifiers(v, declared, free)

def find_function(ast, fn_name):
    """Find a FunctionDeclaration with the given name anywhere in the AST."""
    found = []
    def visit(node):
        if node is None: return
        t = getattr(node, 'type', None)
        if t == 'FunctionDeclaration' and node.id and node.id.name == fn_name:
            found.append(node)
        if hasattr(node, '__dict__'):
            for v in node.__dict__.values():
                if v is None: continue
                if isinstance(v, list):
                    for item in v:
                        if hasattr(item, 'type'): visit(item)
                elif hasattr(v, 'type'):
                    visit(v)
    visit(ast)
    return found

def scan(file_path, fn_name):
    src = open(file_path).read()
    ast = esprima.parseScript(src, options={'tolerant': True, 'loc': True, 'comment': False})
    fns = find_function(ast, fn_name)
    if not fns:
        return {'error': f'function `{fn_name}` not found in {file_path}'}
    if len(fns) > 1:
        return {'error': f'multiple `{fn_name}` declarations found ({len(fns)})'}
    fn = fns[0]
    declared = set()
    _collect_function_locals(fn, declared)
    free = set()
    if fn.body and fn.body.type == 'BlockStatement':
        for stmt in fn.body.body or []:
            _collect_free_identifiers(stmt, declared, free)
    return {
        'function': fn_name,
        'file': file_path,
        'deps': sorted(free),
        'declared_inside': sorted(declared),
        'safe_globals_filtered': sorted(n for n in SAFE_GLOBALS if n in src and n not in declared and n not in free),
    }

def main():
    if len(sys.argv) != 3:
        print(__doc__.split('USAGE:')[1].split('\n\n')[0].strip(), file=sys.stderr)
        sys.exit(2)
    file_path, fn_name = sys.argv[1], sys.argv[2]
    out = scan(file_path, fn_name)
    print(json.dumps(out, indent=2))
    if 'error' in out:
        sys.exit(1)

if __name__ == '__main__':
    main()
