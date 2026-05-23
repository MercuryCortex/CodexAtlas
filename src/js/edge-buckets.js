// ============================================================
// CODEX ATLAS — Universal Edge-Bucket Routing
// ============================================================
// Single source of truth for the 7 semantic edge buckets and
// the type → bucket map. Consumed by:
//   - src/js/views/pantheon-v2.js (sigma view)
//   - src/js/app.js (D3 production views)
//
// Routing follows ONTOLOGY.md §3 (master). Where the
// AUDIT/edge-color-spec-2026-05-17.md narrowed Fusion to
// {syncretic-fusion, appropriated-by, visual-cognate}, this
// module follows ONTOLOGY's broader definition: "two entities
// collapse into one or are explicitly identified" puts every
// `syncretic*` IDENTIFICATION type in Fusion. Structural-
// resemblance sub-types (`*-structural-parallel`, `*-cross-
// tradition-parallel`, etc.) stay in Parallel.
//
// See AUDIT/ontology-pantheon-bucket-routing-2026-05-17.md
// for the full rationale.
// ============================================================
(function () {
  // 7 buckets — hex + idle/hot opacity + width + flags.
  // Hex + opacity values from AUDIT/edge-color-spec §6 verbatim.
  const BUCKETS = {
    transmission: { hex: '#C9743A', idle: 0.10, hot: 0.95, width: 0.34, headline: false, directional: true  },
    parallel:     { hex: '#5A9A8F', idle: 0.12, hot: 0.85, width: 0.30, headline: false, directional: false },
    association:  { hex: '#4A5AA4', idle: 0.08, hot: 0.55, width: 0.22, headline: false, directional: false },
    kinship:      { hex: '#C9A5D4', idle: 0.14, hot: 0.85, width: 0.32, headline: false, directional: false },
    attestation:  { hex: '#D4A55A', idle: 0.10, hot: 0.90, width: 0.30, headline: false, directional: true  },
    polemic:      { hex: '#A83E4A', idle: 0.25, hot: 0.95, width: 0.40, headline: true,  directional: false },
    fusion:       { hex: '#C4783A', idle: 0.30, hot: 0.95, width: 0.36, headline: true,  directional: false },
  };

  // type → bucket. Numeric comments are live edge counts at 2026-05-17.
  const EDGE_BUCKET = {
    // ── Transmission ──────────────────────────────────────────
    'influenced-by':                       'transmission',  // 549
    'influences':                          'transmission',  // 490
    'influenced':                          'transmission',
    'originated':                          'transmission',  // 112
    'heir-of':                             'transmission',  // 60   NEW
    'descended-from':                      'transmission',  // 18   NEW
    'affects-tradition':                   'transmission',  // 373
    'affects-document':                    'transmission',  // 111
    'documents-affected':                  'transmission',
    'produces-document':                   'transmission',  // 49
    'manuscript-transmission':             'transmission',
    'redaction-of':                        'transmission',
    'transmission-to':                     'transmission',  // 46
    'ancestor-of':                         'transmission',  // 250  HEADLINE override
    'syncretic-ancestor-of':               'transmission',  // HEADLINE override
    'syncretic-direct-influence':          'transmission',  // 15   NEW
    'syncretic-lineage-claim':             'transmission',  // RECLASSIFIED from polemic — lineage = ancestry claim, not hostile

    // ── Parallel (structural resemblance, no contact alleged) ──
    'parallel':                            'parallel',      // 89   NEW (bare)
    'parallel-motif':                      'parallel',      // 1025
    'parallel-form':                       'parallel',      // 1185
    'parallel-amulet':                     'parallel',
    'visual-parallel':                     'parallel',
    'structural-parallel':                 'parallel',      // 21
    'structural':                          'parallel',
    'typological':                         'parallel',
    'thematic-overlap':                    'parallel',
    'variant-of':                          'parallel',
    'contested-identification':            'parallel',
    'exemplifies':                         'parallel',
    'instantiation-of':                    'parallel',
    'convergence':                         'parallel',      // 22   NEW
    'syncretic-structural-parallel':       'parallel',      // 171
    'syncretic-parallel-form':             'parallel',      // 26
    'syncretic-parallel-motif':            'parallel',      // 15
    'syncretic-cross-tradition-parallel':  'parallel',      // 39   NEW
    'syncretic-cross-tradition-archetype': 'parallel',      // 17
    'syncretic-functional-parallel':       'parallel',
    'syncretic-parallel':                  'parallel',

    // ── Association (ambient context, theme, membership) ──────
    'has-theme':                           'association',   // 1620
    'context':                             'association',   // 120
    'shared-milieu':                       'association',
    'shared-tradition':                    'association',
    'co-tradition':                        'association',
    'co-appears-with':                     'association',
    'tradition-deity':                     'association',   // 389
    'tradition-doc':                       'association',   // 293
    'tradition-person':                    'association',   // 431
    'symbol-attests-in':                   'association',   // 1630
    'symbol-iconography-of':               'association',   // 944
    'symbol-in-tradition':                 'association',   // 925
    'music-in-tradition':                  'association',   // 219
    'music-attests-in':                    'association',   // 74
    'music-iconography-of':                'association',   // 96
    'participated-in':                     'association',   // 430
    'component-of':                        'association',
    'contains':                            'association',
    'related':                             'association',   // 9
    'member-of':                           'association',   // 10   NEW
    'syncretic-applies-to':                'association',   // 16   NEW
    'syncretic-part-of':                   'association',   // 13   NEW
    'syncretic-shared-tradition':          'association',   // 13   NEW

    // ── Kinship (mythic family) ───────────────────────────────
    'parent-of':                           'kinship',       // 228
    'child-of':                            'kinship',       // 388
    'consort':                             'kinship',       // 182
    'sibling-of':                          'kinship',
    'sibling':                             'kinship',       // 12   NEW (bare)
    'syncretic-sacred-marriage':           'kinship',
    'syncretic-mythological-partner':      'kinship',       // 23   NEW
    'syncretic-child-of':                  'kinship',       // 10   NEW

    // ── Attestation (textual evidence) ────────────────────────
    'attests':                             'attestation',   // 974
    'attested-in':                         'attestation',   // 792
    'mentioned-in':                        'attestation',   // 869
    'key-figure':                          'attestation',   // 755
    'authored':                            'attestation',   // 202
    'attributed-author':                   'attestation',   // 52
    'primary-source':                      'attestation',
    'primary-translation':                 'attestation',
    'critical-edition':                    'attestation',
    'translation':                         'attestation',
    'commentary-on':                       'attestation',
    'direct-quote':                        'attestation',
    'preserved-by':                        'attestation',
    'syncretic-manuscript-transmission':   'attestation',
    'syncretic-attested-in':               'attestation',
    'syncretic-reports-to':                'attestation',

    // ── Polemic (hostile reframing) ───────────────────────────
    'polemic-inversion':                   'polemic',       // 18
    'polemic-against':                     'polemic',
    'syncretic-polemic-against':           'polemic',       // 11
    'syncretic-polemic-inversion':         'polemic',

    // ── Fusion (genuine merger / identification) ──────────────
    // Per ONTOLOGY.md §3: equivalents[] → syncretic → Fusion.
    // ~2,085 edges move from Parallel → Fusion in this patch.
    'syncretic':                           'fusion',        // 935  MOVED
    'syncretic-identification':            'fusion',        //      MOVED
    'syncretic-ancient-identification':    'fusion',        // 336  MOVED
    'syncretic-scholarly-parallel':        'fusion',        // 792  MOVED (per ONTOLOGY; AUDIT spec disagreed)
    'syncretic-folk-syncretism':           'fusion',        // 22   MOVED
    'syncretic-syncretic-identification':  'fusion',        // 28   MOVED
    'syncretic-continuous-development':    'fusion',        //      MOVED
    'syncretic-aspect-of':                 'fusion',        //      MOVED
    'syncretic-instantiation':             'fusion',        //      MOVED
    'syncretic-fusion':                    'fusion',        // 234
    'syncretic-syncretic-fusion':          'fusion',
    'appropriated-by':                     'fusion',        // 16
    'visual-cognate':                      'fusion',        // 105

    // ════════════════════════════════════════════════════════════
    // Phase 21AP (2026-05-23) — PROTOCOL §3.1 21-type vocabulary
    // ════════════════════════════════════════════════════════════
    // The 21 locked cross-tradition edge types from PROTOCOL §3.1.
    // Previously most of these fell through to the default
    // 'association' bucket (ambient blue) — making ~250 cross-
    // tradition edges I wired earlier in this session paint as if
    // they were "shared-tradition" / "has-theme" relations. Now they
    // paint in their semantically correct bucket so the wheel's
    // color-coding actually means what the legend will say it means.
    //
    // Buckets routed PER the methodological-pluralism note in
    // PROTOCOL §3.1 — see that doc for the framework rationale per
    // type (Smith / Assmann / Parker / Dumézil / Mark Smith / etc).
    // ════════════════════════════════════════════════════════════

    // ── PROTOCOL §3.1 — TRANSMISSION (bronze): 5 types ────────
    'cognate':                             'transmission',
    'direct-borrowing':                    'transmission',
    'iconographic-borrowing':              'transmission',
    'substrate-influence':                 'transmission',
    'continuous-development':              'transmission',

    // ── PROTOCOL §3.1 — PARALLEL (teal): 4 types ──────────────
    'scholarly-parallel':                  'parallel',
    // 'parallel-motif' already mapped above (1025 existing edges)
    'functional-equivalent':               'parallel',
    'interpretatio-nominal':               'parallel',      // Assmann translatio deorum
    // Tacitus/Herodotus-era interpretatio variants. The TYPE-level
    // distinction is Parker's nominal/cultic axis; the tradition
    // doing the interpretatio (romana / graeca / germanica / etc)
    // lives in `notes:`. We keep these legacy types in PARALLEL
    // (the safer Assmann reading — "Wōden=Mercury" is translation
    // not merger of cults) for the edges I wired earlier this
    // session before the Phase 1 rename. The Phase 3 data sweep
    // will migrate them to `interpretatio-nominal` over time; until
    // then they paint as parallel like the new type.
    'interpretatio-romana':                'parallel',
    'interpretatio-graeca':                'parallel',
    'interpretatio-germanica':             'parallel',

    // ── PROTOCOL §3.1 — FUSION (orange): 5 types ──────────────
    'same-as':                             'fusion',
    'interpretatio-cultic':                'fusion',        // Parker cultic-mode — new shared cult
    'ancient-identification':              'fusion',
    'composite-deity':                     'fusion',        // Sarapis, Hermes Trismegistus, Amun-Re
    'folk-syncretism':                     'fusion',

    // ── PROTOCOL §3.1 — KINSHIP (lilac): 2 types ──────────────
    'manifestation-of':                    'kinship',       // honji-suijaku / avatara / incarnation
    'avatara-of':                          'kinship',       // legacy — subsumed by manifestation-of via notes variant
    'constituent-of':                      'kinship',

    // ── PROTOCOL §3.1 — POLEMIC (red): 5 types ────────────────
    // 'polemic-against' + 'polemic-inversion' already mapped above
    'demonization':                        'polemic',       // Augustine City of God II.4 — distinct from inversion
    'prefiguration-claim':                 'polemic',       // Justin Martyr logos spermatikos; OT-prefigures-Christ
    'negative-identification':             'polemic',       // Marcion / Islamic Trinity-critique; Wikidata P1889
  };

  // Directional edge types. Bright stop sits on the SEMANTIC origin.
  // Data points source/target the "wrong" way for these — swap gradient stops.
  const REVERSE_DIRECTION = new Set([
    'influenced-by', 'influenced', 'child-of', 'attested-in', 'mentioned-in',
    'documents-affected', 'preserved-by', 'syncretic-attested-in',
  ]);

  // Edge types in symmetric buckets that nonetheless carry direction.
  const DIRECTIONAL_TYPES = new Set([
    'parent-of', 'child-of', 'ancestor-of', 'syncretic-ancestor-of',
    'appropriated-by', 'heir-of', 'descended-from',
  ]);

  // Headline overrides on otherwise non-headline buckets.
  // Per edge-color-spec §4.3, `ancestor-of` paints at 0.30 idle (headline opacity).
  const HEADLINE_TYPES = new Set([
    'ancestor-of', 'syncretic-ancestor-of',
  ]);
  const HEADLINE_IDLE_OVERRIDE = 0.30;

  // Per-type width overrides — preserved for production-Pantheon visual
  // continuity where the old per-type EDGE_STYLE in app.js was hand-tuned.
  // Everything not listed here uses its bucket's default width.
  const WIDTH_OVERRIDES = {
    'ancestor-of':           0.46,
    'syncretic-fusion':      0.42,
    'appropriated-by':       0.42,
    'polemic-inversion':     0.46,
    'visual-cognate':        0.30,
    'symbol-attests-in':     0.26,
    'symbol-iconography-of': 0.28,
    'symbol-in-tradition':   0.24,
  };

  function edgeStyleFor(type) {
    const bucketName  = EDGE_BUCKET[type] || 'association';
    const b           = BUCKETS[bucketName];
    const headline    = b.headline || HEADLINE_TYPES.has(type);
    const directional = b.directional || DIRECTIONAL_TYPES.has(type);
    // Idle: bucket default, OR headline override for `ancestor-of`-like
    // types that sit in a non-headline bucket (Transmission) but still
    // need to read as headline at rest.
    let idle = b.idle;
    if (HEADLINE_TYPES.has(type) && !b.headline) idle = HEADLINE_IDLE_OVERRIDE;
    return {
      bucket:      bucketName,
      c:           b.hex,
      w:           WIDTH_OVERRIDES[type] || b.width,
      op:          idle,
      hotOp:       b.hot,
      headline,
      directional,
      reverse:     REVERSE_DIRECTION.has(type),
    };
  }

  // Expose on window so both pantheon-v2.js (loaded after this) and
  // app.js (loaded after this) can pick up the same singletons.
  window.EDGE_BUCKETS            = BUCKETS;
  window.EDGE_BUCKET             = EDGE_BUCKET;
  window.EDGE_REVERSE_DIRECTION  = REVERSE_DIRECTION;
  window.EDGE_DIRECTIONAL_TYPES  = DIRECTIONAL_TYPES;
  window.EDGE_HEADLINE_TYPES     = HEADLINE_TYPES;
  window.edgeStyleFor            = edgeStyleFor;
})();
