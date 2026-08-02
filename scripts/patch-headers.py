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
    STYLES_VERSION,
    render_header,
    render_quick_contacts,
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

QUICK_CONTACT_PATTERN = re.compile(
    r'^[ \t]*<aside class="quick-contact".*?</aside>\s*',
    re.DOTALL | re.MULTILINE,
)

FOOTER_PATTERN = re.compile(r'^[ \t]*<footer', re.MULTILINE)


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
    new_text = QUICK_CONTACT_PATTERN.sub("", new_text)
    if not FOOTER_PATTERN.search(new_text):
        raise ValueError("footer not found")
    return FOOTER_PATTERN.sub(
        f"{render_quick_contacts()}\n  <footer",
        new_text,
        count=1,
    )


def patch_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    prefix = prefix_for(path)
    active = active_for(path)
    try:
        new_text = patch_html(text, prefix, active)
    except ValueError as error:
        if str(error) == "header not found":
            return False
        print(f"Skipped quick contacts (no footer): {path.relative_to(ROOT)}")
        return False
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
