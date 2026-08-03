# Footer Messenger Integration and Required Consent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate WA/TG/M controls into the bottom-right of every footer and require explicit personal-data consent in every lead form before submission.

**Architecture:** Shared Python renderers and patchers remain the source of generated markup. Footer patching will normalize both full and compact footers, while service generators emit the final structure directly. The existing form validator will gain checkbox-aware validation, and shared asset versions will be bumped to invalidate stale layouts and JavaScript.

**Tech Stack:** Python 3 standard library, generated HTML5, shared CSS, vanilla JavaScript, Python `unittest`, existing Node backend smoke tests.

## Global Constraints

- Messenger controls must be inside `.footer__bottom`, never a standalone block or fixed overlay.
- Copyright remains visible; `WA`, `TG`, `M` remain in one row at the bottom right on desktop and mobile.
- Full footers place `Политика конфиденциальности` in the `Навигация` column; compact footers place it beside `Контакты` above the messenger controls.
- All 27 lead forms contain one unchecked required consent checkbox immediately before submit.
- Unchecked submission stops before network or WhatsApp delivery and shows `Подтвердите согласие на обработку персональных данных.`
- Preserve existing messenger URLs, service values, SEO markup, contact maps, form endpoints, and unrelated dirty backend/report files.

---

### Task 1: Add failing structural and behavior regressions

**Files:**
- Modify: `scripts/test_site_ui.py`
- Create: `scripts/test_form_consent.js`

**Interfaces:**
- Consumes: generated HTML, `css/styles.css`, `js/main.js`, and Python generators.
- Produces: regression coverage for footer nesting, privacy placement, consent markup, generator output, and checkbox validation.

- [ ] **Step 1: Replace standalone-panel assertions with footer-integrated assertions**

Update `scripts/test_site_ui.py` to require zero `class="quick-contact"`, exactly one `class="footer__messengers"`, and nesting within the first `.footer__bottom`:

```python
self.assertNotIn('class="quick-contact"', text)
self.assertEqual(text.count('class="footer__messengers"'), 1)
bottom_start = text.index('class="footer__bottom"')
messengers = text.index('class="footer__messengers"')
self.assertGreater(messengers, bottom_start)
self.assertLess(messengers, text.index("</footer>", bottom_start))
```

- [ ] **Step 2: Add consent coverage for every lead form**

For each form matched by `<form ... (lead-form|consultForm) ...>...</form>`, assert:

```python
self.assertEqual(form.count('name="privacy_consent"'), 1)
self.assertRegex(form, r'<input[^>]+type="checkbox"[^>]+name="privacy_consent"[^>]+required')
self.assertIn("Я даю согласие на обработку персональных данных", form)
self.assertIn("privacy.html", form)
self.assertLess(form.index('name="privacy_consent"'), form.index('type="submit"'))
```

- [ ] **Step 3: Add a Node regression for checkbox-aware validation**

Create `scripts/test_form_consent.js` that loads `js/main.js` into a VM with a stubbed `document`, obtains `validateLeadForm`, and verifies an unchecked required checkbox is returned as invalid while the checked checkbox is accepted. The expected invalid message constant must equal:

```js
'Подтвердите согласие на обработку персональных данных.'
```

- [ ] **Step 4: Run tests and verify failure**

Run:

```bash
python3 -m unittest scripts/test_site_ui.py -v
node scripts/test_form_consent.js
```

Expected: FAIL because current pages still use a standalone panel and forms have no consent checkbox.

- [ ] **Step 5: Commit failing tests**

```bash
git add scripts/test_site_ui.py scripts/test_form_consent.js
git commit -m "test: cover footer integration and form consent"
```

---

### Task 2: Integrate messenger controls into every footer

**Files:**
- Modify: `scripts/site_common.py`
- Modify: `scripts/patch-headers.py`
- Modify: `scripts/build-services.py`
- Modify: `scripts/build-articles.py`
- Modify: `css/styles.css`
- Regenerate: root `*.html`, `articles/*.html`, `services/*.html`
- Test: `scripts/test_site_ui.py`

**Interfaces:**
- Produces: `render_footer_messengers() -> str` and `patch_footer(text: str, prefix: str) -> str`.
- Consumes: the existing messenger URLs and page-depth prefix.

- [ ] **Step 1: Replace the standalone renderer**

Rename `render_quick_contacts()` to `render_footer_messengers()` and return:

```html
<div class="footer__messengers" aria-label="Быстрая связь">
  <a class="footer__messenger footer__messenger--whatsapp" ...><span aria-hidden="true">WA</span></a>
  <a class="footer__messenger footer__messenger--telegram" ...><span aria-hidden="true">TG</span></a>
  <a class="footer__messenger footer__messenger--max" ...><span aria-hidden="true">M</span></a>
</div>
```

- [ ] **Step 2: Add robust footer normalization**

In `patch-headers.py`, add a matching-div helper and `patch_footer(text, prefix)` that:

1. removes legacy `.quick-contact` and `.footer__messengers` groups;
2. moves or inserts the depth-correct privacy link into a full footer's navigation column;
3. creates `.footer__bottom-links` containing `Контакты` and `Политика конфиденциальности` for compact footers;
4. inserts `render_footer_messengers()` before the matching close of `.footer__bottom`.

`patch_html()` must call `patch_footer()` and remain byte-idempotent on the second run.

- [ ] **Step 3: Update both content generators**

Make `build-services.py` and `build-articles.py` emit the compact or full footer with the shared messenger group already inside `.footer__bottom`. Remove every insertion between `</main>` and `<footer>`.

- [ ] **Step 4: Replace standalone CSS with footer-scoped CSS**

Use `.footer__messengers` as a horizontal flex row with `margin-left: auto`; use `.footer__messenger` for 48px desktop and 46px mobile circles. In the mobile `.footer__bottom` rule, keep copyright readable and set:

```css
.footer__messengers,
.footer__bottom-links { align-self: flex-end; }
```

Do not use `position: fixed` or a separate background/padded strip.

- [ ] **Step 5: Rebuild, patch twice, and test**

Run:

```bash
python3 scripts/build-services.py
python3 scripts/build-articles.py
python3 scripts/patch-headers.py
python3 scripts/patch-headers.py
python3 -m unittest scripts/test_site_ui.py -v
```

Expected: second patch reports `Updated 0 files`; footer tests pass.

- [ ] **Step 6: Commit footer integration**

```bash
git add css/styles.css scripts/site_common.py scripts/patch-headers.py scripts/build-services.py scripts/build-articles.py scripts/test_site_ui.py *.html articles/*.html services/*.html
git commit -m "feat: integrate messengers into site footers"
```

---

### Task 3: Require explicit consent in all lead forms

**Files:**
- Modify: `index.html`
- Modify: `contacts.html`
- Modify: `scripts/build-services.py`
- Modify: `js/main.js`
- Modify: `css/styles.css`
- Regenerate: `services/*.html`
- Test: `scripts/test_site_ui.py`
- Test: `scripts/test_form_consent.js`

**Interfaces:**
- Consumes: `validateLeadForm(form, payload)` and `.lead-form` initialization.
- Produces: required `privacy_consent` control and checkbox-aware invalid result.

- [ ] **Step 1: Add shared consent markup to forms**

Insert before submit:

```html
<label class="form__consent">
  <input type="checkbox" name="privacy_consent" value="accepted" class="form__consent-input" required>
  <span>Я даю согласие на обработку персональных данных и принимаю условия <a href="privacy.html">Политики конфиденциальности</a>.</span>
</label>
```

Use `../privacy.html` on service pages. Remove the old passive `.form__privacy` paragraph so consent copy appears once per form.

- [ ] **Step 2: Validate checkbox state before delivery**

In `validateLeadForm`, compute checkbox invalidity from the DOM state:

```js
const checkboxInvalid = field.type === 'checkbox' && !field.checked;
if (!value || phoneInvalid || checkboxInvalid) { ... }
```

Return enough information to let the submit handler show the consent-specific message when `invalid.name === 'privacy_consent'`.

- [ ] **Step 3: Style checked, focused, and invalid states**

Add `.form__consent`, `.form__consent-input`, focus-visible, checked accent, and `[aria-invalid="true"]` styles. Maintain at least a 44px effective label target and mobile wrapping.

- [ ] **Step 4: Bump shared asset versions**

Add/use centralized CSS and JavaScript version constants in `site_common.py`; update `patch-headers.py`, services/articles generators, and every committed page to request the new versions.

- [ ] **Step 5: Rebuild and run consent tests**

Run:

```bash
python3 scripts/build-services.py
python3 scripts/build-articles.py
python3 scripts/patch-headers.py
python3 -m unittest scripts/test_site_ui.py -v
node scripts/test_form_consent.js
```

Expected: all 27 forms contain one required checkbox; unchecked validation fails with the specific message and checked validation passes.

- [ ] **Step 6: Commit consent implementation**

```bash
git add index.html contacts.html services/*.html scripts/build-services.py scripts/build-articles.py scripts/patch-headers.py scripts/site_common.py js/main.js css/styles.css scripts/test_site_ui.py scripts/test_form_consent.js
git commit -m "feat: require consent before lead submission"
```

---

### Task 4: Verify, publish, and confirm production

**Files:**
- Verify only; no planned source changes.

**Interfaces:**
- Consumes: complete branch output.
- Produces: verified and published `main` deployment.

- [ ] **Step 1: Run the complete verification suite**

```bash
python3 -m unittest scripts/test_site_ui.py -v
node scripts/test_form_consent.js
npm test --prefix backend
PYTHONPYCACHEPREFIX=/private/tmp/ls_detailing_footer_consent_pycache python3 -m py_compile scripts/site_common.py scripts/patch-headers.py scripts/build-services.py scripts/build-articles.py scripts/test_site_ui.py
git diff --check
```

- [ ] **Step 2: Browser-check desktop and mobile**

Verify home, contacts, and one service page at desktop and 390px widths. Confirm footer controls are bottom-right, no standalone strip/fixed controls exist, policy placement matches footer type, and unchecked consent blocks submission with focus and the specific message.

- [ ] **Step 3: Merge and push after review**

Fast-forward the approved branch into `main` without staging unrelated dirty files, then run `git push origin main`.

- [ ] **Step 4: Wait for GitHub Pages and verify live markup**

Wait for `pages-build-deployment` success and fetch the home, contacts, and service URLs with a cache-busting query. Verify new CSS/JS versions, nested `.footer__messengers`, required `privacy_consent`, preserved canonical/JSON-LD, and HTTP 200.
