#!/usr/bin/env python3
import importlib.util
import re
import sys
import unittest
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))

from services_data import SERVICES

ROOT = SCRIPTS.parent

PATCH_HEADERS_SPEC = importlib.util.spec_from_file_location(
    "patch_headers", SCRIPTS / "patch-headers.py"
)
PATCH_HEADERS = importlib.util.module_from_spec(PATCH_HEADERS_SPEC)
PATCH_HEADERS_SPEC.loader.exec_module(PATCH_HEADERS)


def full_pages():
    for path in sorted(ROOT.rglob("*.html")):
        text = path.read_text(encoding="utf-8")
        if "<footer" in text:
            yield path, text


def contrast_with_white(hex_color):
    channels = [int(hex_color[index:index + 2], 16) / 255 for index in (1, 3, 5)]
    linear = [
        channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4
        for channel in channels
    ]
    luminance = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2]
    return 1.05 / (luminance + 0.05)


class SiteUiTest(unittest.TestCase):
    def test_header_and_contacts_patch_is_idempotent(self):
        original = """<!DOCTYPE html>
<html><body>
        <div class="topbar"><div>Old topbar</div></div>
        <header class="header" id="header"><div>Old header</div></header>
        <aside class="quick-contact"><a>Old contacts</a></aside>
        <main>Content</main>
        <footer class="footer">Footer</footer>
</body></html>
"""
        once = PATCH_HEADERS.patch_html(original, "", "index")
        twice = PATCH_HEADERS.patch_html(once, "", "index")

        self.assertEqual(twice, once)
        self.assertEqual(once.count('class="quick-contact"'), 1)
        self.assertRegex(once, r'</aside>\s*<footer')

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

    def test_pages_request_the_current_stylesheet_version(self):
        for path, text in full_pages():
            with self.subTest(path=path.relative_to(ROOT)):
                self.assertRegex(text, r'href="(?:\./|\.\./)*css/styles\.css\?v=7"')

    def test_messenger_button_colors_contrast_with_white_labels(self):
        css = (ROOT / "css/styles.css").read_text(encoding="utf-8")
        for modifier in ("whatsapp", "telegram", "max"):
            with self.subTest(modifier=modifier):
                block = re.search(
                    rf"\.quick-contact__link--{modifier}\s*\{{([^}}]*)\}}",
                    css,
                    re.DOTALL,
                ).group(1)
                colors = re.findall(r"#[0-9a-fA-F]{6}", block)
                self.assertTrue(colors)
                for color in colors:
                    self.assertGreaterEqual(contrast_with_white(color), 4.5)

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

    def test_generated_service_pages_keep_seo_markup(self):
        for slug in SERVICES:
            path = ROOT / "services" / f"{slug}.html"
            text = path.read_text(encoding="utf-8")
            with self.subTest(slug=slug):
                canonical = f"https://ls-detailing.ru/services/{slug}.html"
                self.assertIn(f'<link rel="canonical" href="{canonical}">', text)
                self.assertIn("data-seo-graph", text)
                self.assertRegex(text, r'"@type":\s*"Service"')


if __name__ == "__main__":
    unittest.main()
