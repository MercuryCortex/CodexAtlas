#!/usr/bin/env node
/**
 * dump_scripture_corpora.js
 *
 * Extracts the SCRIPTURE_CORPORA object literal from src/js/app.js and
 * emits canonical (corpus_key, religion?, section_label, book_id, book_title)
 * tuples as JSON on stdout. Consumed by scripts/migrate_canonical_corpus.py
 * to build the (doc_id → canonical-corpus) inference table.
 *
 * Usage:
 *   node scripts/dump_scripture_corpora.js > /tmp/scripture-corpora-dump.json
 */

const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, '..', 'src', 'js', 'app.js');
const text = fs.readFileSync(APP, 'utf8');

// Locate `const SCRIPTURE_CORPORA = {` and walk braces to extract the literal.
const declIdx = text.indexOf('const SCRIPTURE_CORPORA = ');
if (declIdx < 0) { console.error('SCRIPTURE_CORPORA declaration not found'); process.exit(1); }
const objStart = text.indexOf('{', declIdx);
let depth = 0, i = objStart;
let inString = false, stringChar = null;
let inLineComment = false, inBlockComment = false;
while (i < text.length) {
  const c = text[i], c2 = text[i + 1];
  if (inLineComment) {
    if (c === '\n') inLineComment = false;
  } else if (inBlockComment) {
    if (c === '*' && c2 === '/') { inBlockComment = false; i += 2; continue; }
  } else if (inString) {
    if (c === '\\' && i + 1 < text.length) { i += 2; continue; }
    if (c === stringChar) { inString = false; stringChar = null; }
  } else {
    // Code context
    if (c === '/' && c2 === '/') { inLineComment = true; i += 2; continue; }
    if (c === '/' && c2 === '*') { inBlockComment = true; i += 2; continue; }
    if (c === "'" || c === '"' || c === '`') { inString = true; stringChar = c; }
    else if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) break;
    }
  }
  i++;
}
const objText = text.substring(objStart, i + 1);

// Debug: confirm extraction boundary.
process.stderr.write(`Extracted ${objText.length} chars\n`);
process.stderr.write(`First 80: ${JSON.stringify(objText.substring(0, 80))}\n`);
process.stderr.write(`Last 80:  ${JSON.stringify(objText.substring(objText.length - 80))}\n`);

// eval in a tight sandbox — SCRIPTURE_CORPORA is a pure literal.
let SCRIPTURE_CORPORA;
try {
  SCRIPTURE_CORPORA = eval('(' + objText + ')');
} catch (err) {
  process.stderr.write('eval failed: ' + err.message + '\n');
  // Write the extracted text for forensic inspection.
  fs.writeFileSync('/tmp/scripture-corpora-extract.js', '(' + objText + ')');
  process.stderr.write('Extract written to /tmp/scripture-corpora-extract.js\n');
  process.exit(1);
}

// Walk and flatten: emit one row per (corpus_key, section_label, book_id).
const rows = [];
for (const corpusKey of Object.keys(SCRIPTURE_CORPORA)) {
  const corpus = SCRIPTURE_CORPORA[corpusKey];
  if (!corpus || !Array.isArray(corpus.sections)) continue;
  const religion = corpus.religion || '';
  const corpusTitle = corpus.title || '';
  for (const section of corpus.sections) {
    const secLabel = section && section.label || '';
    const books = (section && section.books) || [];
    for (const book of books) {
      if (!book || !book.id) continue;
      rows.push({
        corpus_key: corpusKey,
        corpus_title: corpusTitle,
        religion,
        section: secLabel,
        book_id: book.id,
        book_title: book.title || book.label || '',
      });
    }
  }
}

console.log(JSON.stringify({
  corpora: Object.keys(SCRIPTURE_CORPORA),
  rows,
  counts: {
    corpora: Object.keys(SCRIPTURE_CORPORA).length,
    rows: rows.length,
    distinct_book_ids: new Set(rows.map(r => r.book_id)).size,
  },
}, null, 2));
