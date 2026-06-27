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

from site_common import render_topbar, render_header  # noqa: E402

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
    r"(?:<div class=\"topbar\">.*?</div>\s*)?"
    r"<header class=\"(?:site-header|header)\" id=\"header\">.*?</header>",
    re.DOTALL,
)


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


def patch_file(path: Path) -> bool:
    text = path.read_text(encoding="utf-8")
    if not HEADER_PATTERN.search(text):
        return False
    prefix = prefix_for(path)
    active = active_for(path)
    new_header = render_topbar(prefix) + "\n" + render_header(prefix, active)
    new_text = HEADER_PATTERN.sub(new_header, text, count=1)
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
