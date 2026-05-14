import os, re, glob
from collections import Counter
os.chdir('~/Desktop/Codex Atlas')
md_files = glob.glob('**/*.md', recursive=True)
stems = {os.path.splitext(os.path.basename(f))[0]: f for f in md_files}
link_re = re.compile(r'\[\[([^\]|#]+?)(?:\|[^\]]+)?\]\]')
targets = Counter()
target_files = {}
for f in md_files:
    try: text = open(f, encoding='utf-8').read()
    except: continue
    for m in link_re.finditer(text):
        t = m.group(1).strip().split('/')[-1]
        targets[t] += 1
        target_files.setdefault(t, set()).add(f)
dead = [(t,c) for t,c in targets.items() if t not in stems]
dead.sort(key=lambda x: -x[1])
with open('99_ingest/audit_dead.txt','w') as out:
    for t,c in dead: out.write(f'{c}\t{t}\n')
with open('99_ingest/audit_dead_files.txt','w') as out:
    for t,c in dead:
        out.write(f'{c}\t{t}\t{"; ".join(sorted(target_files[t]))}\n')
print(f'TOTAL DEAD: {len(dead)} targets / {sum(c for _,c in dead)} occurrences')
print(f'TOTAL FILES: {len(md_files)}')
