export const meta = {
  name: 'atlas-read-stage',
  description: 'Draft + adversarially verify cross-tradition READER entries (scripture-texts.js) at scale. Agents draft, a skeptic fact-checks every source + verifies exact public-domain text + node-slug existence; main thread serializes to JS, gates, commits.',
  whenToUse: 'Scale the READ surface. args = array of target texts {ref, title, cluster, note}. Returns validated reader-entry JSON + skeptic verdicts for main-thread assembly. NEVER writes the live tree.',
  phases: [
    { title: 'Draft', detail: 'one agent per text: exact public-domain text + grep-verified annotations + multiple sourced cross-tradition parallels' },
    { title: 'Factcheck', detail: 'one skeptic per text: every source web-verified real, text exact-not-paraphrased, every node-slug exists, every word an exact substring' },
  ],
}

let _args = args
if (typeof _args === 'string') { try { _args = JSON.parse(_args) } catch (_e) { _args = [] } }
const TEXTS = Array.isArray(_args) ? _args : []
if (!TEXTS.length) { log('No target texts in args.'); return { error: 'empty', nodes: [] } }
log(`READ-staging fleet on ${TEXTS.length} text(s): ${TEXTS.map(t => t.title || t.ref).join(' · ')}`)

const ENTRY_SCHEMA = {
  type: 'object',
  required: ['id', 'title', 'corpus', 'tradId', 'docNode', 'language', 'intro', 'crossTradition', 'sections', 'nodeSlugsUsed', 'sourcesUsed', 'textIsExactPublicDomain', 'selfFlags'],
  properties: {
    id: { type: 'string', description: 'kebab-case reader id, e.g. psalm-104 (must NOT already exist in scripture-texts.js)' },
    title: { type: 'string' }, shortTitle: { type: 'string' },
    corpus: { type: 'string' }, tradId: { type: 'string', description: 'a grep-verified 07_traditions/ node id' },
    date: { type: 'string' },
    docNode: { type: 'string', description: 'a grep-verified 02_documents/ node id (the source document) — must exist' },
    language: { type: 'string', description: 'language + the exact public-domain translation cited' },
    intro: { type: 'string', description: '2-4 sentences framing the text and its cross-tradition significance' },
    crossTradition: { type: 'array', items: { type: 'object', required: ['label', 'note'], properties: { label: { type: 'string' }, textId: { type: 'string', description: 'a STAGED reader id if one exists, else omit' }, note: { type: 'string', description: 'SOURCED — name the scholar/work supporting the parallel' } } } },
    sections: { type: 'array', items: { type: 'object', required: ['heading', 'verses'], properties: { heading: { type: 'string' }, verses: { type: 'array', items: { type: 'object', required: ['ref', 'text', 'entities'], properties: { ref: { type: 'string' }, text: { type: 'string', description: 'EXACT public-domain verse text, verbatim — never paraphrased' }, entities: { type: 'array', items: { type: 'object', required: ['word', 'node', 'type', 'note', 'parallels'], properties: { word: { type: 'string', description: 'an EXACT substring of this verse text' }, node: { type: 'string', description: 'a grep-VERIFIED vault node slug' }, type: { type: 'string' }, note: { type: 'string', description: 'sourced where it makes a scholarly claim' }, parallels: { type: 'array', items: { type: 'object', required: ['label', 'note'], properties: { label: { type: 'string' }, textId: { type: 'string' }, note: { type: 'string', description: 'sourced' } } } } } } } } } } } } },
    nodeSlugsUsed: { type: 'array', items: { type: 'string' }, description: 'every node slug used in any entity — each grep-confirmed to exist' },
    sourcesUsed: { type: 'array', items: { type: 'object', required: ['claim', 'source'], properties: { claim: { type: 'string' }, source: { type: 'string' } } } },
    textIsExactPublicDomain: { type: 'boolean', description: 'true ONLY if every verse text is verbatim from the cited public-domain edition' },
    selfFlags: { type: 'array', items: { type: 'string' } },
  },
}
const VERDICT_SCHEMA = {
  type: 'object', required: ['id', 'verdict', 'textExact', 'deadSlugs', 'badSources', 'badWords', 'notes'],
  properties: {
    id: { type: 'string' }, verdict: { type: 'string', enum: ['pass', 'revise', 'reject'] },
    textExact: { type: 'boolean', description: 'true iff every verse matches the cited public-domain edition verbatim' },
    deadSlugs: { type: 'array', items: { type: 'string' }, description: 'node slugs that do NOT exist on disk' },
    badSources: { type: 'array', items: { type: 'object', required: ['source', 'concern'], properties: { source: { type: 'string' }, concern: { type: 'string' } } } },
    badWords: { type: 'array', items: { type: 'string' }, description: "annotation 'word' values that are NOT an exact substring of their verse text" },
    notes: { type: 'string' },
  },
}

const MODEL = `Model your entry on the staged exemplars — Read src/data/scripture-texts.js and study the 'isaiah-51' and 'enuma-elish-4' entries (their structure, annotation style, and the honest transmission-vs-convergence framing).`

async function draftStage(t) {
  const prompt = `You are staging ONE scripture passage as a cross-tradition READER entry for the Codex Atlas.
Target: ${t.ref}  —  ${t.title || ''}  (cluster: ${t.cluster || 'general'})
What to surface: ${t.note || ''}

${MODEL}

RULES (the product's trust depends on these):
1. EXACT PUBLIC-DOMAIN TEXT. Quote the verses VERBATIM from a public-domain edition (KJV 1611 for the Bible; a named public-domain translation otherwise). NEVER paraphrase. State the edition in 'language'. Set textIsExactPublicDomain=true only if you did this.
2. VERIFY THE DOC. grep 02_documents for the source document → 'docNode' (must exist). grep 07_traditions for 'tradId' (must exist). If you cannot find a real docNode, put your best candidate and selfFlag it.
3. ANNOTATE with grep-VERIFIED node slugs only. For each key term: word (an EXACT substring of the verse text), node (run \`find 03_deities 06_themes 09_symbols 04_persons 02_documents -iname "<slug>.md"\` to CONFIRM it exists — if absent, do not use it), type, note, and parallels. MULTIPLE sourced parallels per term are encouraged (John wants several claims, each sourced).
4. SOURCE EVERY SCHOLARLY CLAIM. Each note/parallel that asserts a connection names a real scholar or work (Gunkel, Day, West, Eliade, Pingree, Assmann, etc.). List them all in sourcesUsed. Do NOT invent citations.
5. crossTradition: 3-6 panel entries; use textId only for reader ids that are ALREADY staged (grep \`SCRIPTURE_TEXTS\\['<id>'\\]\`).
6. id must be new (grep-confirm it is not already in scripture-texts.js).

Return the validated JSON + nodeSlugsUsed (every slug, each grep-confirmed) + sourcesUsed + textIsExactPublicDomain + selfFlags.`
  const out = await agent(prompt, { label: `draft:${t.ref}`, phase: 'Draft', schema: ENTRY_SCHEMA })
  return out ? { ...out, _t: t } : { id: t.ref, _died: true, _t: t }
}

async function factcheckStage(d) {
  if (!d || d._died) return { ...(d || {}), verdict: { id: d?.id, verdict: 'reject', notes: 'draft agent died' } }
  const prompt = `ADVERSARIAL fact-check of a Codex Atlas reader entry. Default to flagging when uncertain.
ENTRY (${d.id}): ${JSON.stringify({ title: d.title, language: d.language, docNode: d.docNode, sections: d.sections, crossTradition: d.crossTradition, nodeSlugsUsed: d.nodeSlugsUsed, sourcesUsed: d.sourcesUsed }).slice(0, 16000)}

Check, ruthlessly:
1. TEXT EXACT: is every verse 'text' verbatim from the cited public-domain edition (e.g. KJV)? Paraphrase or misquote → textExact:false (web-search / recall the real text to confirm).
2. SLUGS: for every slug in nodeSlugsUsed AND every entity.node, confirm a file exists: \`find 03_deities 04_persons 06_themes 09_symbols 02_documents 07_traditions -iname "<slug>.md"\`. List any that don't in deadSlugs. (Also check docNode + tradId exist.)
3. SOURCES: web-verify each entry in sourcesUsed is a REAL work by that author. Fabricated/misattributed → badSources.
4. WORDS: each entity 'word' must be an exact substring of its verse 'text'. List mismatches in badWords.
verdict: pass / revise / reject.`
  const v = await agent(prompt, { label: `factcheck:${d.id}`, phase: 'Factcheck', schema: VERDICT_SCHEMA })
  return { ...d, verdict: v || { id: d.id, verdict: 'revise', notes: 'skeptic died' } }
}

const results = (await pipeline(TEXTS, draftStage, factcheckStage)).filter(Boolean)
const drafted = results.filter(r => !r._died)
log(`Done. drafted=${drafted.length}; pass=${drafted.filter(r => r.verdict?.verdict === 'pass').length} revise=${drafted.filter(r => r.verdict?.verdict === 'revise').length} reject=${drafted.filter(r => r.verdict?.verdict === 'reject').length}`)
return {
  counts: { total: TEXTS.length, drafted: drafted.length },
  entries: drafted.map(r => ({
    id: r.id, title: r.title, shortTitle: r.shortTitle, corpus: r.corpus, tradId: r.tradId, date: r.date,
    docNode: r.docNode, language: r.language, intro: r.intro, crossTradition: r.crossTradition, sections: r.sections,
    nodeSlugsUsed: r.nodeSlugsUsed, sourcesUsed: r.sourcesUsed, textIsExactPublicDomain: r.textIsExactPublicDomain,
    selfFlags: r.selfFlags, verdict: r.verdict,
  })),
}
