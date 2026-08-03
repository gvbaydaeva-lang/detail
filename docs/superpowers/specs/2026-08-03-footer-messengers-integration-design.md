# Footer Messenger Integration Design

## Goal

Remove the standalone messenger strip and integrate the three messenger shortcuts into the site's footer on every page.

## Approved layout

- The messenger shortcuts are part of `.footer__bottom`, not a separate block above the footer.
- Copyright stays on the left and the shortcuts stay at the bottom right.
- The shortcuts appear in one horizontal row, in this order: `WA`, `TG`, `M`.
- Desktop and mobile both keep the shortcuts right-aligned.
- All three controls use the same circular dimensions and accessible colors.

## Footer links

- On full footers, move `Политика конфиденциальности` into the `Навигация` column.
- On compact service and article footers, place `Контакты` and `Политика конфиденциальности` in a small footer-links group before the messenger shortcuts.
- Keep the copyright visible in the bottom row.

## Shared implementation

- `site_common.py` remains the single source for messenger markup.
- The shared renderer will return a footer-scoped controls group rather than a standalone `<aside>`.
- Page patching and content generators will remove legacy standalone or floating messenger markup and insert one controls group inside the first `.footer__bottom`.
- Service, article, listing, root, and mobile pages must produce the same three controls.

## Cache and compatibility

- Increment the stylesheet cache version so previously cached fixed/vertical rules cannot remain active.
- Preserve messenger URLs, accessible labels, safe external-link attributes, canonical tags, JSON-LD, contact maps, lead forms, and existing user backend work.

## Verification

- Structural tests will verify one messenger group per full page, nested inside `.footer__bottom`, after the footer links and before the bottom container closes.
- Tests will verify the order and URLs, absence of standalone `.quick-contact`, current stylesheet version, mobile right alignment, accessible contrast, and generator idempotency.
- Browser checks will cover a full-footer home page and a compact-footer service page at desktop and mobile widths.
