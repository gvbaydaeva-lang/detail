#!/usr/bin/env python3
import importlib.util
import re
import sys
import tempfile
import unittest
from html.parser import HTMLParser
from pathlib import Path

SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))

from services_data import SERVICES
from site_common import SCRIPTS_VERSION, STYLES_VERSION

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


class MarkupNode:
    def __init__(self, tag, attrs, parent=None):
        self.tag = tag
        self.attrs = dict(attrs)
        self.parent = parent
        self.children = []

    def descendants(self):
        for child in self.children:
            if isinstance(child, MarkupNode):
                yield child
                yield from child.descendants()

    def text(self):
        return "".join(child for child in self.children if isinstance(child, str)) + "".join(
            child.text() for child in self.children if isinstance(child, MarkupNode)
        )


class MarkupTree(HTMLParser):
    VOID_TAGS = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "wbr"}

    def __init__(self):
        super().__init__()
        self.root = MarkupNode("root", [])
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        node = MarkupNode(tag, attrs, self.stack[-1])
        self.stack[-1].children.append(node)
        if tag not in self.VOID_TAGS:
            self.stack.append(node)

    def handle_endtag(self, tag):
        for index in range(len(self.stack) - 1, 0, -1):
            if self.stack[index].tag == tag:
                del self.stack[index:]
                return

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def parse_markup(text):
    tree = MarkupTree()
    tree.feed(text)
    return tree.root


def nodes_with_class(root, class_name):
    return [
        node
        for node in root.descendants()
        if isinstance(node, MarkupNode) and class_name in node.attrs.get("class", "").split()
    ]


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

    def test_full_footer_patch_is_idempotent(self):
        original = """<!DOCTYPE html>
<html><body>
<header class="header" id="header"></header>
<footer class="footer">
  <div class="container">
    <div class="footer__grid">
      <div><h4 class="footer__heading">Навигация</h4><a href="contacts.html" class="footer__link">Контакты</a></div>
    </div>
    <div class="footer__bottom"><p>Footer</p><a href="privacy.html" class="footer__link">Политика конфиденциальности</a></div>
  </div>
</footer>
</body></html>
"""
        once = PATCH_HEADERS.patch_html(original, "", "services")
        twice = PATCH_HEADERS.patch_html(once, "", "services")

        self.assertEqual(twice, once)
        self.assert_footer_has_messengers(once)

    def assert_footer_has_messengers(self, text):
        self.assertNotIn('class="quick-contact"', text)
        self.assertEqual(text.count('class="footer__messengers"'), 1)
        bottom_start = text.index('class="footer__bottom"')
        messengers = text.index('class="footer__messengers"')
        self.assertGreater(messengers, bottom_start)
        self.assertLess(messengers, text.index("</footer>", bottom_start))
        footer = nodes_with_class(parse_markup(text), "footer")[0]
        footer_bottoms = nodes_with_class(footer, "footer__bottom")
        messenger_nodes = nodes_with_class(footer, "footer__messengers")
        self.assertIn(messenger_nodes[0], list(footer_bottoms[0].descendants()))
        controls = messenger_nodes[0]
        self.assertEqual(
            [node.text().strip() for node in controls.descendants() if node.tag == "span"],
            ["WA", "TG", "M"],
        )
        self.assertEqual(
            [node.attrs.get("href") for node in controls.descendants() if node.tag == "a"],
            [
                "https://wa.me/message/VTM6WDF3RHO7C1",
                "https://t.me/+79618422227",
                "https://max.ru/u/f9LHodD0cOIuJfGnlIDorPs9KmvAuaXCx5b0g_xDXPa1e5oa1pMcjjTLu1k",
            ],
        )
        self.assert_footer_privacy_placement(footer, footer_bottoms[0], controls)

    def assert_footer_privacy_placement(self, footer, footer_bottom, messengers):
        if nodes_with_class(footer, "footer__grid"):
            navigation_heading = next(
                node
                for node in footer.descendants()
                if node.tag == "h4" and node.text().strip() == "Навигация"
            )
            navigation_column = navigation_heading.parent
            self.assertTrue(
                any(
                    node.tag == "a" and "privacy.html" in node.attrs.get("href", "")
                    for node in navigation_column.descendants()
                )
            )
            return

        actions = nodes_with_class(footer_bottom, "footer__bottom-actions")
        self.assertEqual(len(actions), 1)
        self.assertIs(actions[0].parent, footer_bottom)
        action_children = [child for child in actions[0].children if isinstance(child, MarkupNode)]
        self.assertEqual(
            [child.attrs.get("class") for child in action_children],
            ["footer__bottom-links", "footer__messengers"],
        )
        footer_nodes = list(actions[0].descendants())
        contacts = next(
            node
            for node in footer_nodes
            if node.tag == "a" and "contacts.html" in node.attrs.get("href", "")
        )
        privacy = next(
            node
            for node in footer_nodes
            if node.tag == "a" and "privacy.html" in node.attrs.get("href", "")
        )
        self.assertLess(footer_nodes.index(contacts), footer_nodes.index(privacy))
        self.assertLess(footer_nodes.index(privacy), footer_nodes.index(messengers))

    def test_each_page_has_footer_integrated_messengers(self):
        for path, text in full_pages():
            with self.subTest(path=path.relative_to(ROOT)):
                self.assert_footer_has_messengers(text)

    def test_footer_messengers_are_a_right_aligned_single_row_with_mobile_centering(self):
        css = (ROOT / "css/styles.css").read_text(encoding="utf-8")
        block_match = re.search(
            r"\.footer__messengers\s*\{([^}]*)\}", css, re.DOTALL
        )
        self.assertIsNotNone(block_match)
        block = block_match.group(1)
        self.assertRegex(block, r"\bdisplay\s*:\s*flex\s*;")
        self.assertNotRegex(block, r"\bflex-direction\s*:\s*column(?:-reverse)?\s*;")
        self.assertRegex(block, r"\bmargin-left\s*:\s*auto\s*;")

        mobile_css = re.search(
            r"@media\s*\(max-width:\s*768px\)\s*\{(.*)", css, re.DOTALL
        ).group(1)
        self.assertRegex(
            mobile_css,
            r"\.footer__messengers\s*\{[^}]*\bjustify-content\s*:\s*center\s*;[^}]*\}",
        )

    def test_each_lead_form_requires_privacy_consent_before_submit(self):
        form_pattern = re.compile(
            r'<form\b[^>]*(?:lead-form|consultForm)[^>]*>.*?</form>', re.DOTALL
        )
        lead_form_count = 0
        for path, text in full_pages():
            forms = form_pattern.findall(text)
            for form in forms:
                lead_form_count += 1
                with self.subTest(path=path.relative_to(ROOT)):
                    self.assertEqual(form.count('name="privacy_consent"'), 1)
                    self.assertRegex(form, r'<input[^>]+type="checkbox"[^>]+name="privacy_consent"[^>]+required')
                    consent_input = re.search(
                        r'<input[^>]+type="checkbox"[^>]+name="privacy_consent"[^>]*>', form
                    ).group(0)
                    self.assertNotRegex(consent_input, r'\schecked(?:\s|=|>)')
                    self.assertIn("Я даю согласие на обработку персональных данных", form)
                    self.assertIn("privacy.html", form)
                    self.assertLess(form.index('name="privacy_consent"'), form.index('type="submit"'))
        self.assertEqual(lead_form_count, 27)

    def test_pages_request_the_current_stylesheet_version(self):
        for path, text in full_pages():
            with self.subTest(path=path.relative_to(ROOT)):
                self.assertRegex(
                    text,
                    rf'href="(?:\./|\.\./)*css/styles\.css\?v={STYLES_VERSION}"',
                )
                self.assertRegex(
                    text,
                    rf'src="(?:\./|\.\./)*js/main\.js\?v={SCRIPTS_VERSION}"',
                )

    def test_patch_file_surfaces_footer_structure_errors(self):
        with tempfile.TemporaryDirectory(dir=ROOT) as directory:
            path = Path(directory) / "broken-footer.html"
            path.write_text(
                '<header class="header" id="header"></header>'
                '<footer class="footer"><div class="footer__grid"></div>'
                '<div class="footer__bottom"></div></footer>',
                encoding="utf-8",
            )
            with self.assertRaisesRegex(ValueError, "footer navigation not found"):
                PATCH_HEADERS.patch_file(path)

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
                        self.assertIn(f"css/styles.css?v={STYLES_VERSION}", text)
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
