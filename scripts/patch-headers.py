#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Замена topbar+header на единый site-header во всех HTML-файлах."""

import re
import sys
from pathlib import Path
from typing import Optional

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPTS))

from site_common import (  # noqa: E402
    SCRIPTS_VERSION,
    STYLES_VERSION,
    render_footer_messengers,
    render_header,
    render_topbar,
)

ACTIVE_BY_NAME = {
    "index.html": "index",
    "services.html": "services",
    "advantages.html": "advantages",
    "works.html": "works",
    "useful.html": "useful",
    "reviews.html": "reviews",
    "about.html": "about",
    "contacts.html": "contacts",
}

HEADER_PATTERN = re.compile(
    r"^[ \t]*(?:<div class=\"topbar\">.*?</div>\s*)?"
    r"<header class=\"(?:site-header|header)\" id=\"header\">.*?</header>",
    re.DOTALL | re.MULTILINE,
)

TAG_PATTERN = re.compile(r"</?([a-zA-Z][\w:-]*)\b[^>]*>")
CLASS_ATTRIBUTE_PATTERN = re.compile(r"\bclass\s*=\s*(['\"])(.*?)\1", re.DOTALL)


def prefix_for(path: Path) -> str:
    rel = path.relative_to(ROOT)
    depth = len(rel.parts) - 1
    return "../" * depth


def active_for(path: Path) -> Optional[str]:
    name = path.name
    if name in ACTIVE_BY_NAME:
        return ACTIVE_BY_NAME[name]
    if path.parent.name == "articles":
        return "useful"
    if path.parent.name == "services":
        return "services"
    return None


def matching_tag_end(text: str, opening_start: int) -> int:
    """Return the index immediately after the matching closing tag."""
    opening = TAG_PATTERN.match(text, opening_start)
    if not opening or text[opening_start + 1 : opening_start + 2] == "/":
        raise ValueError("opening tag not found")
    tag = opening.group(1)
    depth = 0
    for match in TAG_PATTERN.finditer(text, opening_start):
        if match.group(1) != tag:
            continue
        if text[match.start() + 1 : match.start() + 2] == "/":
            depth -= 1
            if depth == 0:
                return match.end()
        elif not text[match.end() - 2 : match.end()] == "/>":
            depth += 1
    raise ValueError(f"matching closing tag not found for {tag}")


def class_element(text: str, class_name: str, start: int = 0, end: Optional[int] = None):
    """Find an element carrying class_name and its matching closing position."""
    limit = len(text) if end is None else end
    for match in TAG_PATTERN.finditer(text, start, limit):
        if text[match.start() + 1 : match.start() + 2] == "/":
            continue
        classes = CLASS_ATTRIBUTE_PATTERN.search(match.group(0))
        if classes and class_name in classes.group(2).split():
            close = matching_tag_end(text, match.start())
            if close <= limit:
                return match.start(), match.end(), close
    return None


def remove_class_elements(text: str, class_name: str) -> str:
    while found := class_element(text, class_name):
        start, _, close = found
        line_start = text.rfind("\n", 0, start) + 1
        if text[line_start:start].strip() == "":
            start = line_start
        if close < len(text) and text[close : close + 1] == "\n":
            close += 1
        text = text[:start] + text[close:]
    return text


def line_indent(text: str, position: int) -> str:
    return re.search(r"[ \t]*$", text[:position]).group(0)


def indented(block: str, indent: str) -> str:
    return "\n".join(f"{indent}{line}" if line else line for line in block.splitlines())


def remove_footer_links(text: str, footer_start: int, footer_end: int, names: tuple[str, ...]) -> str:
    footer = text[footer_start:footer_end]
    names_pattern = "|".join(re.escape(name) for name in names)
    footer = re.sub(
        rf'\s*<a\b[^>]*href=["\'](?:\./|\.\./)*({names_pattern})\.html["\'][^>]*>.*?</a>',
        "",
        footer,
        flags=re.DOTALL,
    )
    return text[:footer_start] + footer + text[footer_end:]


def patch_footer(text: str, prefix: str) -> str:
    """Normalize footer links and place one shared messenger row in its bottom."""
    text = remove_class_elements(text, "quick-contact")
    text = remove_class_elements(text, "footer__bottom-actions")
    text = remove_class_elements(text, "footer__messengers")
    text = remove_class_elements(text, "footer__bottom-links")

    footer = class_element(text, "footer")
    if not footer:
        raise ValueError("footer not found")
    footer_start, _, footer_end = footer
    text = remove_footer_links(text, footer_start, footer_end, ("privacy",))

    footer = class_element(text, "footer")
    footer_start, _, footer_end = footer
    grid = class_element(text, "footer__grid", footer_start, footer_end)
    if grid:
        navigation = None
        for heading in re.finditer(r"<h4\b[^>]*>\s*Навигация\s*</h4>", text[grid[0]:grid[2]]):
            heading_start = grid[0] + heading.start()
            candidates = [
                match.start()
                for match in TAG_PATTERN.finditer(text, grid[0], heading_start)
                if match.group(1) == "div" and text[match.start() + 1 : match.start() + 2] != "/"
                and matching_tag_end(text, match.start()) >= heading_start
            ]
            if candidates:
                navigation_start = candidates[-1]
                navigation = (navigation_start, matching_tag_end(text, navigation_start))
                break
        if not navigation:
            raise ValueError("footer navigation not found")
        closing_start = navigation[1] - len("</div>")
        text = text[:closing_start].rstrip() + text[closing_start:]
        navigation = (navigation[0], matching_tag_end(text, navigation[0]))
        navigation_indent = line_indent(text, navigation[0])
        privacy = f'<a href="{prefix}privacy.html" class="footer__link">Политика конфиденциальности</a>'
        text = text[: navigation[1] - len("</div>")] + f"\n{navigation_indent}  {privacy}\n{navigation_indent}" + text[navigation[1] - len("</div>") :]
    else:
        footer = class_element(text, "footer")
        footer_start, _, footer_end = footer
        text = remove_footer_links(text, footer_start, footer_end, ("contacts", "privacy"))

    footer = class_element(text, "footer")
    footer_start, _, footer_end = footer
    bottom = class_element(text, "footer__bottom", footer_start, footer_end)
    if not bottom:
        raise ValueError("footer bottom not found")
    bottom_start, _, bottom_end = bottom
    closing_start = bottom_end - len("</div>")
    text = text[:closing_start].rstrip() + text[closing_start:]
    footer = class_element(text, "footer")
    bottom = class_element(text, "footer__bottom", footer[0], footer[2])
    bottom_start, _, bottom_end = bottom
    bottom_indent = line_indent(text, bottom_start)
    blocks = []
    if not grid:
        links = f"""<div class="footer__bottom-links">
  <a href="{prefix}contacts.html" class="footer__link">Контакты</a>
  <a href="{prefix}privacy.html" class="footer__link">Политика конфиденциальности</a>
</div>"""
        actions = "\n".join((
            '<div class="footer__bottom-actions">',
            indented(links, "  "),
            indented(render_footer_messengers(), "  "),
            "</div>",
        ))
        blocks.append(indented(actions, bottom_indent + "  "))
    else:
        blocks.append(indented(render_footer_messengers(), bottom_indent + "  "))
    insertion = "\n" + "\n".join(blocks) + "\n" + bottom_indent
    closing_start = bottom_end - len("</div>")
    return text[:closing_start] + insertion + text[closing_start:]


def patch_html(text: str, prefix: str, active: Optional[str]) -> str:
    if not HEADER_PATTERN.search(text):
        raise ValueError("header not found")
    new_header = render_topbar(prefix) + "\n" + render_header(prefix, active)
    new_text = HEADER_PATTERN.sub(new_header, text, count=1)
    new_text = re.sub(
        r'(href="(?:\./|\.\./)*css/styles\.css\?v=)\d+(")',
        rf'\g<1>{STYLES_VERSION}\2',
        new_text,
    )
    new_text = re.sub(
        r'(src="(?:\./|\.\./)*js/main\.js\?v=)\d+(")',
        rf'\g<1>{SCRIPTS_VERSION}\2',
        new_text,
    )
    return patch_footer(new_text, prefix)


def patch_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if "<footer" not in text:
        print(f"Skipped footer patch (no footer): {path.relative_to(ROOT)}")
        return False
    prefix = prefix_for(path)
    active = active_for(path)
    new_text = patch_html(text, prefix, active)
    if new_text == text:
        return False
    path.write_text(new_text, encoding="utf-8")
    return True


def main():
    updated = 0
    for path in sorted(ROOT.rglob("*.html")):
        if patch_file(path):
            print(f"Patched: {path.relative_to(ROOT)}")
            updated += 1
    print(f"Done. Updated {updated} files.")


if __name__ == "__main__":
    main()
