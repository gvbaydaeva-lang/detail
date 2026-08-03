#!/usr/bin/env python3
import importlib.util
import re
import sys
import tempfile
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

BUILD_ARTICLES_SPEC = importlib.util.spec_from_file_location(
    "build_articles", SCRIPTS / "build-articles.py"
)
BUILD_ARTICLES = importlib.util.module_from_spec(BUILD_ARTICLES_SPEC)
BUILD_ARTICLES_SPEC.loader.exec_module(BUILD_ARTICLES)


def full_pages():
    for path in sorted(ROOT.rglob("*.html")):
        text = path.read_text(encoding="utf-8")
        if "<footer" in text:
            yield path, text


class SiteUiTest(unittest.TestCase):
    def test_header_and_contacts_patch_is_idempotent(self):
        original = """<!DOCTYPE html>
<html><body>
        <div class="topbar"><div>Old topbar</div></div>
        <header class="header" id="header"><div>Old header</div></header>
        <aside class="quick-contact"><a>Old contacts</a></aside>
        <main>Content</main>
        <footer class="footer"><div class="footer__bottom">Footer</div></footer>
</body></html>
"""
        once = PATCH_HEADERS.patch_html(original, "", "index")
        twice = PATCH_HEADERS.patch_html(once, "", "index")

        self.assertEqual(twice, once)
        self.assert_footer_has_messengers(once)

    def assert_footer_has_messengers(self, text):
        self.assertNotIn('class="quick-contact"', text)
        self.assertEqual(text.count('class="footer__messengers"'), 1)
        bottom_start = text.index('class="footer__bottom"')
        messengers = text.index('class="footer__messengers"')
        self.assertGreater(messengers, bottom_start)
        self.assertLess(messengers, text.index("</footer>", bottom_start))

    def test_each_page_has_footer_integrated_messengers(self):
        for path, text in full_pages():
            with self.subTest(path=path.relative_to(ROOT)):
                self.assert_footer_has_messengers(text)

    def test_each_lead_form_requires_privacy_consent_before_submit(self):
        form_pattern = re.compile(
            r'<form\b[^>]*(?:lead-form|consultForm)[^>]*>.*?</form>', re.DOTALL
        )
        for path, text in full_pages():
            forms = form_pattern.findall(text)
            for form in forms:
                with self.subTest(path=path.relative_to(ROOT)):
                    self.assertEqual(form.count('name="privacy_consent"'), 1)
                    self.assertRegex(form, r'<input[^>]+type="checkbox"[^>]+name="privacy_consent"[^>]+required')
                    self.assertIn("Я даю согласие на обработку персональных данных", form)
                    self.assertIn("privacy.html", form)
                    self.assertLess(form.index('name="privacy_consent"'), form.index('type="submit"'))

    def test_pages_request_the_current_stylesheet_version(self):
        for path, text in full_pages():
            with self.subTest(path=path.relative_to(ROOT)):
                self.assertRegex(text, r'href="(?:\./|\.\./)*css/styles\.css\?v=7"')

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

    def test_article_generator_keeps_footer_contacts_styles_and_seo(self):
        with tempfile.TemporaryDirectory() as directory:
            temporary_root = Path(directory)
            original_root = BUILD_ARTICLES.ROOT
            original_articles_dir = BUILD_ARTICLES.ARTICLES_DIR
            seo_module = getattr(BUILD_ARTICLES, "APPLY_SEO", None)
            original_seo_root = getattr(seo_module, "ROOT", None)
            try:
                BUILD_ARTICLES.ROOT = temporary_root
                BUILD_ARTICLES.ARTICLES_DIR = temporary_root / "articles"
                if seo_module:
                    seo_module.ROOT = temporary_root
                BUILD_ARTICLES.main()
                paths = [temporary_root / "useful.html"]
                paths.extend((temporary_root / "articles").glob("*.html"))
                for path in paths:
                    text = path.read_text(encoding="utf-8")
                    with self.subTest(path=path.relative_to(temporary_root)):
                        self.assertIn("css/styles.css?v=7", text)
                        self.assert_footer_has_messengers(text)
                        self.assertIn('rel="canonical"', text)
                        self.assertIn("data-seo-graph", text)
            finally:
                BUILD_ARTICLES.ROOT = original_root
                BUILD_ARTICLES.ARTICLES_DIR = original_articles_dir
                if seo_module:
                    seo_module.ROOT = original_seo_root


if __name__ == "__main__":
    unittest.main()
