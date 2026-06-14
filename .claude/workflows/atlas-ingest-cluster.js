export const meta = {
  name: 'atlas-ingest-cluster',
  description: 'Author + adversarially verify a batch of Codex Atlas dead-endpoint nodes (Engine ③ Ingestion). Agents draft content + self-skeptic; main thread integrates + gates.',
  whenToUse: 'Run on a verified worklist of genuinely-absent nodes (existence + demand already grep-confirmed). args = array of node records {slug,type,tradition,region,hubs,demand,note}. Returns drafts + skeptic verdicts for main-thread integration. NEVER writes the live tree — that is the main thread\'s gated job.',
  phases: [
    { title: 'Author', detail: 'one agent per node: verify-absent, read model + hub, write the full .md, wire into hub via a LIVE edge field' },
    { title: 'Skeptic', detail: 'one adversarial reviewer per node: citations real? tradition singular? overclaims? edge live?' },
  ],
}

// === The worklist ===
// args is the batch of node records the main thread already grep-verified (absent + demanded).
// Each record: { slug, type, tradition, region, hubs:[{slug,edgeField}], demand, note }
// Tolerate args arriving as a JSON-encoded string (some tool-call paths stringify it).
let _args = args
if (typeof _args === 'string') { try { _args = JSON.parse(_args) } catch (_e) { _args = [] } }
if (_args && !Array.isArray(_args) && Array.isArray(_args.nodes)) { _args = _args.nodes }
const NODES = Array.isArray(_args) ? _args : []
if (!NODES.length) {
  log('No node records passed in args — nothing to ingest. Pass args = [{slug,type,tradition,...}, ...].')
  return { error: 'empty worklist', authored: [] }
}
log(`Ingestion fleet starting on ${NODES.length} node(s): ${NODES.map(n => n.slug).join(', ')}`)

// === Schemas ===
const AUTHOR_SCHEMA = {
  type: 'object',
  required: ['slug', 'exists', 'type', 'tradition', 'fileDir', 'fileName', 'fileContent', 'hubWires', 'sources', 'selfFlags', 'summary'],
  properties: {
    slug: { type: 'string' },
    exists: { type: 'boolean', description: 'true if a node for this concept ALREADY exists under any slug/variant — if so, do NOT author; report the path' },
    existsPath: { type: ['string', 'null'] },
    type: { type: 'string', enum: ['deity', 'person', 'theme', 'symbol', 'event'] },
    tradition: { type: 'string', description: 'SINGULAR origin tradition only — never a multi-tradition list' },
    region: { type: 'string' },
    fileDir: { type: 'string', description: 'e.g. 03_deities or 06_themes or 04_persons or 09_symbols' },
    fileName: { type: 'string', description: 'e.g. rahab.md' },
    fileContent: { type: 'string', description: 'the COMPLETE .md file: YAML frontmatter + body, on the tehom.md model' },
    hubWires: {
      type: 'array',
      description: 'how the HUB should reciprocally point at this node — for the main thread to apply',
      items: {
        type: 'object',
        required: ['hubSlug', 'hubFile', 'edgeField', 'entry'],
        properties: {
          hubSlug: { type: 'string' },
          hubFile: { type: 'string', description: 'verified path to the hub .md' },
          edgeField: { type: 'string', description: 'the LIVE edge field on the hub to append to (deity-instances / parallels / appearances) — NEVER related-themes' },
          entry: { type: 'string', description: 'exact list entry to add, e.g. "[[rahab]]"' },
        },
      },
    },
    sources: {
      type: 'array',
      items: {
        type: 'object',
        required: ['title', 'author', 'year', 'tier', 'confidence'],
        properties: {
          title: { type: 'string' },
          author: { type: 'string' },
          year: { type: ['integer', 'string'] },
          tier: { type: 'integer' },
          confidence: { type: 'string', enum: ['certain', 'likely', 'unsure'], description: 'unsure = flag for main-thread web-verification; NEVER invent a citation to fill space' },
        },
      },
    },
    selfFlags: { type: 'array', items: { type: 'string' }, description: 'anything you are unsure about — type call, tradition origin, a citation, a transmission claim' },
    summary: { type: 'string', description: 'one line: what this node is + which hub(s) it completes' },
  },
}

const SKEPTIC_SCHEMA = {
  type: 'object',
  required: ['slug', 'verdict', 'citationFlags', 'membershipOk', 'overclaimFixes', 'wireOk', 'notes'],
  properties: {
    slug: { type: 'string' },
    verdict: { type: 'string', enum: ['pass', 'revise', 'reject'] },
    citationFlags: {
      type: 'array',
      description: 'refs you cannot vouch for as real works — default to flagging when uncertain',
      items: { type: 'object', required: ['ref', 'concern'], properties: { ref: { type: 'string' }, concern: { type: 'string' } } },
    },
    membershipOk: { type: 'boolean', description: 'true iff tradition: is SINGULAR and the genuine origin tradition' },
    membershipNote: { type: 'string' },
    overclaimFixes: {
      type: 'array',
      description: 'uncited superlatives or transmission asserted as fact where it is actually debated — quote the phrase + give a hedged rewrite',
      items: { type: 'object', required: ['quote', 'fix'], properties: { quote: { type: 'string' }, fix: { type: 'string' } } },
    },
    wireOk: { type: 'boolean', description: 'true iff the node wires into its hub via a LIVE edge field (not inert related-themes) and the reciprocal hubWire targets a live field' },
    wireNote: { type: 'string' },
    notes: { type: 'string' },
  },
}

// === Engine ③ rules, shared by every author agent ===
const RULES = `
CODEX ATLAS — rigor firewall (NON-NEGOTIABLE):
1. MEMBERSHIP-VS-WIRE: a node has ONE home tradition (its origin). tradition: is SINGULAR. Cross-tradition
   reach is expressed as WIRES (edges), never crammed into tradition:. (e.g. Rahab's origin = Hebrew Bible;
   its Ugaritic/Canaanite background and Christian reception are WIRES/notes, not extra traditions.)
2. WIRE INTO A LIVE EDGE FIELD. For a deity node: a structured 'syncretic-edges:' block (each entry: target +
   type + source + source-tier) AND/OR the plain 'parallels:'/'equivalents:' wikilink lists. For a theme node:
   'parallels:' and/or 'cross-tradition-parallels:'. 'related-themes:' is INERT (build_data does NOT emit an
   edge from it) — never rely on it for a wire. Always wire the node -> its hub, with a real T1 source on the edge.
3. T1 ACADEMIC DEFAULT. Cite only real, checkable, mainstream scholarship (monographs, critical commentaries,
   reference works). Represent dissent honestly: where transmission vs independent convergence is debated, say so
   and name both sides (the model node cites Gunkel AND Tsumura). NO uncited superlatives or invented figures.
   If you are not confident a citation is a real work, set its confidence:"unsure" and add a selfFlag — do NOT
   invent a citation to fill the slot.
4. HONEST CROSS-TRADITION FRAMING. The '## Cross-tradition significance' section states transmission-vs-convergence
   for THIS node's hub parallel as carefully as the model does. Distinguish secure linguistic cognates from
   structural/typological parallels.
`.trim()

// === Stage 1: Author ===
async function authorStage(rec) {
  const hubList = (rec.hubs || []).map(h => `${h.slug} (suggested edge field: ${h.edgeField || 'read the hub & choose a live one'})`).join('; ')
  const prompt = `You are an academic encyclopedist DRAFTING ONE new node for the Codex Atlas cross-tradition investigation vault.

HARD CONSTRAINT — READ-ONLY: Do NOT create, Write, or Edit ANY file in the repository (not the node file, not its hub). You may only read and grep. Your SOLE deliverable is the structured return value; the main thread writes every file after adversarial review + gating. Writing files yourself bypasses the review gate and races sibling agents.

Your node: "${rec.slug}"  —  intended type: ${rec.type}  —  origin tradition: ${rec.tradition}  —  region: ${rec.region || '(determine)'}
It must complete this/these comparative hub(s): ${hubList}
Why it is needed: ${rec.note || ''}  (hub-prose demand signal: ${rec.demand || 'n/a'})

STEP 0 — VERIFY ABSENT (the cardinal rule — prior agents produced false-positives):
  Run: find 03_deities 04_persons 05_events 06_themes 09_symbols 02_documents 07_traditions -iname "*${rec.slug}*.md"
  AND check obvious name variants (latinized/anglicized/transliterated forms, e.g. ulysses for odysseus,
  azhi-dahaka/dahaka for azi-dahaka, world-mountain/axis-mundi/cosmic-mountain for meru, tao for dao).
  If a node for this CONCEPT already exists under any slug, set exists:true, existsPath, and STOP (do not author).
  Incidental substring matches inside unrelated words (e.g. "rta" inside ninuRTA) do NOT count as existing.

STEP 1 — STUDY THE MODELS (read them, do not guess the format):
  - Read 03_deities/tehom.md  (the gold-standard node: YAML frontmatter, syncretic-edges wires, refs with tier,
    and the honest "Cross-tradition significance" + "Disputes" prose. MATCH this depth and this honesty.)
  - Read the hub file(s) for ${(rec.hubs || []).map(h => h.slug).join(', ')} (find them under 06_themes/). See how the hub
    already discusses this figure and which edge field it lists members in — your reciprocal hubWire must target THAT
    live field (or 'parallels'). Confirm the hub mentions your figure; if it does not, note it in selfFlags.
  - Optionally read one already-wired sibling member of the hub to match the typing convention (e.g. how leviathan /
    typhon / vritra are typed for a chaos-being; orpheus vs heracles for a hero; how a daeva is handled).

STEP 2 — DETERMINE TYPE precisely (report it; flag if unsure):
  chaos-monster or dragon-slayer or divine judge-of-the-dead -> deity; abstract cosmic-order/Word concept -> theme;
  legendary mortal hero without major cult -> person (model: orpheus); cult-hero/divinized -> deity (model: heracles);
  iconographic image/diagram -> symbol. When genuinely split, pick the comparative-slot fit and add a selfFlag.

STEP 3 — AUTHOR the complete .md (frontmatter + body) on the tehom.md model:
  - Full YAML: type, id, name, aka, SINGULAR tradition, region, period dates + dating-basis, domains/role,
    relevant relations, the WIRES (syncretic-edges for a deity / parallels for a theme — INCLUDING the edge to its
    hub(s) with a T1 source + source-tier), status: "full", refs (with tier + a notes line), tags.
  - Body: ## Identity, ## In [its corpus/myth-cycle], ## Cross-tradition significance (honest transmission-vs-
    convergence, named dissent), ## Disputes (if applicable), ## Refs.
  - Keep it encyclopedic and specific (named texts, passages, dates). No filler, no uncited superlatives.

STEP 4 — RETURN the structured output: exists/existsPath, type, tradition, region, fileDir, fileName, the COMPLETE
  fileContent string, hubWires (how each hub should reciprocally point back — verified live field + exact entry),
  sources (each with a confidence), selfFlags, summary.

${RULES}`
  const out = await agent(prompt, { label: `author:${rec.slug}`, phase: 'Author', schema: AUTHOR_SCHEMA })
  return out ? { ...out, _rec: rec } : { slug: rec.slug, exists: false, _rec: rec, _died: true }
}

// === Stage 2: Skeptic (adversarial verifier) ===
async function skepticStage(author) {
  if (!author || author._died) return { ...(author || {}), skeptic: { slug: author?.slug, verdict: 'reject', notes: 'author agent died' } }
  if (author.exists) return { ...author, skeptic: { slug: author.slug, verdict: 'pass', citationFlags: [], membershipOk: true, overclaimFixes: [], wireOk: true, notes: 'already exists — wire-only, no authoring' } }
  const prompt = `You are an ADVERSARIAL academic reviewer for the Codex Atlas. Your job is to REFUTE, not rubber-stamp.
Default to flagging when uncertain. Review this freshly-authored node and return specific, actionable findings.

NODE (${author.slug}, type ${author.type}, tradition "${author.tradition}"):
--- BEGIN FILE ---
${(author.fileContent || '').slice(0, 14000)}
--- END FILE ---
Author-declared sources: ${JSON.stringify(author.sources || [])}
Author self-flags: ${JSON.stringify(author.selfFlags || [])}
Reciprocal hub wires proposed: ${JSON.stringify(author.hubWires || [])}

Check, in order:
1. CITATIONS — for EVERY ref in the frontmatter/Refs: is it a real work, by that author, near that year? Flag any you
   cannot vouch for (wrong author, wrong date, title that does not exist, a real author credited with a book they did
   not write). Hallucinated citations are the #1 failure mode — be ruthless. You may web-search if a tool is available.
2. MEMBERSHIP — is tradition: SINGULAR and the genuine ORIGIN tradition? (Cross-tradition reach belongs in wires, not
   tradition.) Set membershipOk false + explain if a second tradition has been smuggled into the field.
3. OVERCLAIM — any uncited superlative ("the first", "the most", "directly derived from") or any transmission asserted
   as established fact where scholarship actually debates it? Quote the phrase and give a hedged rewrite.
4. WIRE — does the node wire into its hub via a LIVE edge field (syncretic-edges / parallels / equivalents), not the
   inert related-themes? Do the proposed reciprocal hubWires target a live field? Set wireOk accordingly.

verdict: 'pass' (ship as-is), 'revise' (ship after the listed fixes), or 'reject' (fundamentally wrong — explain).`
  const skeptic = await agent(prompt, { label: `skeptic:${author.slug}`, phase: 'Skeptic', schema: SKEPTIC_SCHEMA })
  return { ...author, skeptic: skeptic || { slug: author.slug, verdict: 'revise', notes: 'skeptic agent died — main-thread review required' } }
}

const results = await pipeline(NODES, authorStage, skepticStage)
const clean = results.filter(Boolean)
const exists = clean.filter(r => r.exists)
const drafted = clean.filter(r => !r.exists && !r._died)
const passed = drafted.filter(r => r.skeptic?.verdict === 'pass')
const revise = drafted.filter(r => r.skeptic?.verdict === 'revise')
const reject = drafted.filter(r => r.skeptic?.verdict === 'reject')
log(`Done. drafted=${drafted.length} (pass=${passed.length} revise=${revise.length} reject=${reject.length}) · already-exists=${exists.length}`)

return {
  counts: { total: NODES.length, drafted: drafted.length, pass: passed.length, revise: revise.length, reject: reject.length, exists: exists.length },
  existsAlready: exists.map(r => ({ slug: r.slug, path: r.existsPath })),
  nodes: drafted.map(r => ({
    slug: r.slug, type: r.type, tradition: r.tradition, region: r.region,
    fileDir: r.fileDir, fileName: r.fileName, fileContent: r.fileContent,
    hubWires: r.hubWires, sources: r.sources, selfFlags: r.selfFlags, summary: r.summary,
    skeptic: r.skeptic,
  })),
}
