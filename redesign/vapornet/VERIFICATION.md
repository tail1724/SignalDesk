# Build Loop verification record

Status: **handoff-ready prototype; not a production release**

This record applies to the HTML design prototype and blueprint in this package.
It does not claim that either GitHub repository has been changed or that a
production deployment has passed its release gate.

## Deterministic gate — passed

- `html-validate index.html design-blueprint.html` — passed with zero errors.
- `node --check prototype.js` — passed.
- CSS parsed into a complete AST with `css-tree` — passed.
- `verify.cjs` — **32 assertions passed**.
- The optimized hero poster is 368 KB, below the 500 KB prototype budget.
- Signal red `#C93D37` against white is approximately 4.99:1, above the WCAG
  AA threshold for normal text.

The interaction harness exercises:

- all five requested screens and active/hidden state;
- 390px mobile composition, night mode and reduced-motion fallback;
- standard/revenue placement-policy switching;
- consent-center open, close and Escape behavior;
- Hunt's Pointe preflight, required draft acknowledgement, staging state,
  receipt and Payload queue handoff;
- explicit preservation of the unpublished review-draft status;
- city-edition switching and dismissible mobile anchor;
- unique IDs, one main landmark, button semantics and accessible names;
- absence of runtime DOM errors.

## Visual/device gate — required before production merge

The cloud preview environment refused local-development URLs under its security
policy, so no indirect browser workaround was used and this row is deliberately
not marked passed. Engineering must run the visual matrix from the blueprint in
its normal local and staging browsers and attach evidence to the implementation
PR:

- 390×844 and 412×915 mobile; 768×1024 tablet; 1440×900 and 1920×1080 desktop;
- day/night, standard/revenue and normal/reduced-motion states;
- Home, Section, Article, Hunt's Pointe and Payload surfaces;
- draft transfer, consent, empty/error/no-fill and governance-blocked states;
- keyboard traversal, 200% zoom, VoiceOver/NVDA spot checks and current Chrome,
  Safari and Firefox screenshots.

## Release invariant

Hunt's Pointe may create an unpublished review draft only. Automatic publishing,
CPM-driven topic selection, missing consent, incomplete RBAC, unscanned creative,
missing audit evidence or invalid `ads.txt`/`sellers.json` keeps the production
gate open.
