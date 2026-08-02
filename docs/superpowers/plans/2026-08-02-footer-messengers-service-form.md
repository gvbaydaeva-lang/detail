# Footer Messengers and Service Form Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the three messenger shortcuts into a consistent footer-adjacent row on every page and replace every service-page lead block with the home-page form design.

**Architecture:** Keep shared markup in the existing Python generators. `site_common.py` will own the messenger panel, `patch-headers.py` will place it before each footer on existing pages, and `build-services.py` will generate the new service form layout. A structural regression test will scan every generated HTML page, while browser checks will verify desktop and mobile layout.

**Tech Stack:** Python 3 standard library, generated HTML5, shared CSS, existing vanilla JavaScript form handling.

## Global Constraints

- The panel appears immediately before the footer and never uses fixed positioning.
- The panel contains exactly three circular links in this order: `WA`, `TG`, `M`.
- The same markup and behavior must work on desktop and mobile.
- Service pages reuse the visual structure of the home-page consultation form.
- The selected service remains in the hidden `service` field.
- Messenger URLs, the contacts page map, lead submission behavior, and the site domain remain unchanged.
- Do not modify or commit unrelated dirty-worktree files.

---

### Task 1: Add structural regression tests

**Files:**
- Create: `scripts/test_site_ui.py`
- Test: `scripts/test_site_ui.py`

**Interfaces:**
- Consumes: generated `*.html` files, `css/styles.css`, and `scripts/services_data.py::SERVICES`.
- Produces: a `unittest` suite used after each generator change.

- [ ] **Step 1: Write the failing tests**

```python
#!/usr/bin/env python3
import re
import sys
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))

from services_data import SERVICES

ROOT = SCRIPTS.parent


def full_pages():
    for path in sorted(ROOT.rglob("*.html")):
        text = path.read_text(encoding="utf-8")
        if "<footer" in text:
            yield path, text


class SiteUiTest(unittest.TestCase):
    def test_each_page_has_one_messenger_panel_before_footer(self):
        for path, text in full_pages():
            with self.subTest(path=path.relative_to(ROOT)):
                self.assertEqual(text.count('class="quick-contact"'), 1)
                panel = text.index('class="quick-contact"')
                self.assertLess(panel, text.index("<footer"))
                self.assertRegex(text, r'</aside>\s*<footer')
                self.assertNotIn("quick-contact__text", text)

    def test_each_panel_contains_wa_tg_and_m_in_order(self):
        pattern = re.compile(
            r'<aside class="quick-contact".*?</aside>', re.DOTALL
        )
        for path, text in full_pages():
            with self.subTest(path=path.relative_to(ROOT)):
                panel = pattern.search(text).group(0)
                labels = re.findall(r'<span aria-hidden="true">([^<]+)</span>', panel)
                self.assertEqual(labels, ["WA", "TG", "M"])
                self.assertIn("wa.me/message/VTM6WDF3RHO7C1", panel)
                self.assertIn("t.me/+79618422227", panel)
                self.assertIn("max.ru/u/", panel)

    def test_quick_contact_is_not_fixed(self):
        css = (ROOT / "css/styles.css").read_text(encoding="utf-8")
        block = re.search(r"\.quick-contact\s*\{([^}]*)\}", css, re.DOTALL).group(1)
        self.assertNotIn("position: fixed", block)

    def test_service_pages_use_home_style_form_without_cta_map(self):
        for slug, data in SERVICES.items():
            path = ROOT / "services" / f"{slug}.html"
            text = path.read_text(encoding="utf-8")
            with self.subTest(slug=slug):
                self.assertIn('class="form-section form-section--service"', text)
                self.assertIn('class="form-wrap form-wrap--home', text)
                self.assertIn('class="form form--home lead-form service-lead-form"', text)
                self.assertIn(f'name="service" value="{data["title"]}"', text)
                self.assertNotIn("service-cta__map", text)


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test and verify the current site fails**

Run: `python3 -m unittest scripts/test_site_ui.py -v`

Expected: FAIL because the panel is currently near the header, includes full labels, uses fixed positioning, and service pages still contain `service-cta__map`.

- [ ] **Step 3: Commit the failing regression test**

```bash
git add scripts/test_site_ui.py
git commit -m "test: cover footer contacts and service forms"
```

---

### Task 2: Centralize and relocate the messenger panel

**Files:**
- Modify: `scripts/site_common.py:145-160`
- Modify: `scripts/patch-headers.py:15-60`
- Modify: `scripts/build-services.py:1-390`
- Modify: `css/styles.css:2564-2608,3915-3928`
- Regenerate: root `*.html`, `articles/*.html`, `services/*.html`
- Test: `scripts/test_site_ui.py`

**Interfaces:**
- Consumes: existing messenger URLs and the existing `render_site_header(prefix, active)` API.
- Produces: `render_quick_contacts() -> str`, containing one `<aside>` with three links; `render_site_header()` returns only the topbar and header.

- [ ] **Step 1: Add a dedicated renderer and remove the panel from the header renderer**

Implement in `scripts/site_common.py`:

```python
def render_quick_contacts():
    return """  <aside class="quick-contact" aria-label="Быстрая связь">
    <a href="https://wa.me/message/VTM6WDF3RHO7C1" class="quick-contact__link quick-contact__link--whatsapp" target="_blank" rel="noopener" aria-label="Написать в WhatsApp"><span aria-hidden="true">WA</span></a>
    <a href="https://t.me/+79618422227" class="quick-contact__link quick-contact__link--telegram" target="_blank" rel="noopener" aria-label="Написать в Telegram"><span aria-hidden="true">TG</span></a>
    <a href="https://max.ru/u/f9LHodD0cOIuJfGnlIDorPs9KmvAuaXCx5b0g_xDXPa1e5oa1pMcjjTLu1k" class="quick-contact__link quick-contact__link--max" target="_blank" rel="noopener" aria-label="Написать в MAX"><span aria-hidden="true">M</span></a>
  </aside>"""


def render_site_header(prefix="", active=None):
    return render_topbar(prefix) + "\n" + render_header(prefix, active)
```

- [ ] **Step 2: Make header patching idempotently move the panel before the footer**

In `scripts/patch-headers.py`, import `render_quick_contacts`, remove every existing `quick-contact` block before insertion, and place one rendered panel immediately before the first `<footer`:

```python
QUICK_CONTACT_PATTERN = re.compile(
    r'\s*<aside class="quick-contact".*?</aside>', re.DOTALL
)

cleaned = QUICK_CONTACT_PATTERN.sub("", new_text)
panel = render_quick_contacts()
new_text = cleaned.replace("<footer", f"{panel}\n  <footer", 1)
```

Keep the existing depth-aware header links unchanged. Raise or report a skipped file if it has a header but no footer rather than inserting the panel in an arbitrary location.

- [ ] **Step 3: Place the shared panel in generated service HTML**

Import `render_quick_contacts` in `scripts/build-services.py` and add `{render_quick_contacts()}` between `</main>` and `<footer` in both `render_service_page()` and `render_services_page()`.

- [ ] **Step 4: Replace the sticky styles with a footer-adjacent horizontal row**

Update `css/styles.css` so `.quick-contact` is a normal-flow flex row centered inside the page width, with padding and no fixed offsets or high overlay z-index. Make each `.quick-contact__link` a 48-by-48-pixel circle with centered letters. Retain the three service colors and hover/focus feedback. The mobile rule must keep the row horizontal and use at least a 44-by-44-pixel tap target.

- [ ] **Step 5: Rebuild and patch all pages**

Run:

```bash
python3 scripts/build-services.py
python3 scripts/patch-headers.py
```

Expected: every full HTML page has one panel immediately before its footer; no page has a panel next to its header.

- [ ] **Step 6: Run the messenger regression tests**

Run: `python3 -m unittest scripts.test_site_ui.SiteUiTest.test_each_page_has_one_messenger_panel_before_footer scripts.test_site_ui.SiteUiTest.test_each_panel_contains_wa_tg_and_m_in_order scripts.test_site_ui.SiteUiTest.test_quick_contact_is_not_fixed -v`

Expected: PASS.

- [ ] **Step 7: Commit the messenger-panel change**

```bash
git add scripts/site_common.py scripts/patch-headers.py scripts/build-services.py css/styles.css index.html services.html advantages.html works.html useful.html reviews.html about.html contacts.html privacy.html articles/*.html services/*.html
git commit -m "feat: move messenger links above footer"
```

---

### Task 3: Rebuild the service lead block from the home-page component

**Files:**
- Modify: `scripts/build-services.py:105-145,210-245`
- Modify: `css/styles.css:2975-3030,3150-3205`
- Regenerate: `services/*.html`
- Test: `scripts/test_site_ui.py`

**Interfaces:**
- Consumes: `render_lead_form(service_title: str) -> str`, existing `.form-wrap--home` and `.form--home` styles, and existing JavaScript handling for `.lead-form`.
- Produces: service-page `form-section--service` markup with a service-specific intro and the unchanged hidden `service` value.

- [ ] **Step 1: Change the service form markup to reuse the home form classes**

Update `render_lead_form()` so the form starts with:

```html
<form class="form form--home lead-form service-lead-form" novalidate>
```

Add the home-page placeholder to the name input, rename the comment label to «Что нужно сделать», and use «Марка, модель и желаемые работы» as the textarea placeholder. Preserve the honeypot, required attributes, request types, policy link, status container, and service-specific hidden input.

- [ ] **Step 2: Replace the old CTA and map with the two-column home-style section**

Generate this structure in `render_service_page()`:

```html
<section class="form-section form-section--service" id="consultation">
  <div class="container">
    <div class="form-wrap form-wrap--home form-wrap--service reveal">
      <div class="form-wrap__intro">
        <p class="form-wrap__eyebrow">Запись в LS Detailing</p>
        <h2 class="form-wrap__title">Записаться на «SERVICE TITLE»</h2>
        <p class="form-wrap__desc">Оценим состояние автомобиля, уточним сроки и предложим решение без лишних работ.</p>
        <ul class="form-wrap__benefits" aria-label="Преимущества консультации">
          <li>Ответим и уточним детали</li>
          <li>Согласуем удобное время</li>
          <li>Без навязанных услуг</li>
        </ul>
      </div>
      SERVICE FORM
    </div>
  </div>
</section>
```

Remove `service-cta__map`, its address copy, and `MAP_IFRAME` from the service-page generator. Do not alter the contacts page or global footer contacts.

- [ ] **Step 3: Add only service-specific layout adjustments**

Reuse the existing home component rules. Add `.form-section--service` and `.form-wrap--service` only where service pages need spacing or long-title wrapping. Remove obsolete `.service-cta`, `.service-cta__inner`, `.service-cta__map`, and one-column service-form overrides once no generated page uses them. At the existing tablet/mobile breakpoints, keep a single-column layout and full-width controls without horizontal overflow.

- [ ] **Step 4: Regenerate service pages**

Run: `python3 scripts/build-services.py && python3 scripts/patch-headers.py`

Expected: all files in `services/` contain the new block, correct service name, and footer messenger row.

- [ ] **Step 5: Run the complete structural test suite**

Run: `python3 -m unittest scripts/test_site_ui.py -v`

Expected: PASS for every full page and every service in `SERVICES`.

- [ ] **Step 6: Run existing backend smoke tests to detect unrelated regressions**

Run: `npm test --prefix backend`

Expected: PASS with the existing lead API behavior unchanged.

- [ ] **Step 7: Commit the service-form redesign**

```bash
git add scripts/build-services.py css/styles.css services/*.html
git commit -m "feat: align service forms with home design"
```

---

### Task 4: Browser verification and final consistency check

**Files:**
- Modify if visual defects are found: `css/styles.css`
- Regenerate after any generator fix: affected `*.html`
- Test: `scripts/test_site_ui.py`

**Interfaces:**
- Consumes: the generated site and its shared CSS/JavaScript.
- Produces: verified desktop and mobile behavior matching the approved screenshots and specification.

- [ ] **Step 1: Start a local static server**

Run: `python3 -m http.server 8000 --bind 127.0.0.1`

Expected: the project is available at `http://127.0.0.1:8000/`.

- [ ] **Step 2: Verify desktop layouts**

Open `index.html`, `services/okleika-vinilovaya.html`, and `about.html` at a 1440-pixel viewport. Verify the panel is visible only near the footer, the three circles are aligned in one row, the service block matches the home form visual language, long service names wrap cleanly, and the map is absent from service CTAs.

- [ ] **Step 3: Verify mobile layouts**

Repeat the same pages at a 390-pixel viewport. Verify no horizontal scrolling, all form controls fit the viewport, the messenger buttons remain in one row, and no content is covered.

- [ ] **Step 4: Verify interactions**

Check that each messenger link resolves to the unchanged destination, required name and phone validation still runs, the service hidden input contains the page service, and the fallback WhatsApp link still appears when no API endpoint is configured.

- [ ] **Step 5: Run final automated checks**

Run:

```bash
python3 -m unittest scripts/test_site_ui.py -v
npm test --prefix backend
git diff --check
```

Expected: all tests pass and `git diff --check` produces no output.

- [ ] **Step 6: Review scope before completion**

Run: `git status --short` and `git diff --stat`.

Expected: only the new test, shared UI generators/styles, and regenerated HTML pages are part of this feature; the pre-existing backend/report files remain untouched.
