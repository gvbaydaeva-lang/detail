#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Добавляет статические хлебные крошки и BreadcrumbList на внутренние страницы."""

import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SITE_URL = "https://ls-detailing.ru"
ROOT_TITLES = {
    "about.html": "О нас",
    "advantages.html": "Преимущества",
    "contacts.html": "Контакты",
    "privacy.html": "Политика конфиденциальности",
    "reviews.html": "Отзывы",
    "services.html": "Услуги",
    "useful.html": "Полезное",
    "works.html": "Работы",
}


def plain_text(value):
    return html.unescape(re.sub(r"<[^>]+>", "", value)).strip()


def page_title(source):
    match = re.search(r"<h1[^>]*>(.*?)</h1>", source, flags=re.DOTALL | re.IGNORECASE)
    if not match:
        raise ValueError("Страница не содержит H1")
    return plain_text(match.group(1))


def breadcrumb_items(relative_path, title):
    relative_path = relative_path.replace("\\", "/")
    if relative_path.startswith("services/"):
        return [
            ("Главная", "../index.html", f"{SITE_URL}/"),
            ("Услуги", "../services.html", f"{SITE_URL}/services.html"),
            (title, None, f"{SITE_URL}/{relative_path}"),
        ]
    if relative_path.startswith("articles/"):
        return [
            ("Главная", "../index.html", f"{SITE_URL}/"),
            ("Полезное", "../useful.html", f"{SITE_URL}/useful.html"),
            (title, None, f"{SITE_URL}/{relative_path}"),
        ]
    return [
        ("Главная", "index.html", f"{SITE_URL}/"),
        (title, None, f"{SITE_URL}/{relative_path}"),
    ]


def render_breadcrumbs(items):
    parts = []
    for index, (name, href, _url) in enumerate(items):
        escaped_name = html.escape(name)
        if href:
            content = f'<a class="breadcrumbs__link" href="{href}">{escaped_name}</a>'
        else:
            content = f'<span class="breadcrumbs__current" aria-current="page">{escaped_name}</span>'
        parts.append(
            f'        <li class="breadcrumbs__item">{content}</li>'
            + (
                '\n        <li class="breadcrumbs__separator" aria-hidden="true">/</li>'
                if index < len(items) - 1
                else ""
            )
        )
    return (
        '\n    <nav class="breadcrumbs" aria-label="Хлебные крошки" data-breadcrumbs>\n'
        '      <div class="container">\n'
        '        <ol class="breadcrumbs__list">\n'
        + "\n".join(parts)
        + '\n        </ol>\n'
        '      </div>\n'
        '    </nav>\n'
    )


def render_schema(items):
    payload = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {
                "@type": "ListItem",
                "position": index,
                "name": name,
                "item": url,
            }
            for index, (name, _href, url) in enumerate(items, 1)
        ],
    }
    return (
        '  <script type="application/ld+json" data-breadcrumb-schema>\n'
        f"{json.dumps(payload, ensure_ascii=False, indent=2)}\n"
        "  </script>\n"
    )


def apply_breadcrumbs(source, relative_path):
    if relative_path == "index.html":
        return source

    source = re.sub(
        r'\n[ \t]*<nav class="breadcrumbs"[^>]*data-breadcrumbs>.*?</nav>\n?',
        "\n",
        source,
        flags=re.DOTALL,
    )
    source = re.sub(
        r'\n[ \t]*<script type="application/ld\+json" data-breadcrumb-schema>.*?</script>\n?',
        "\n",
        source,
        flags=re.DOTALL,
    )
    source = re.sub(
        r'\n[ \t]*<a href="\.\./services\.html" class="service-back">.*?</a>\n?',
        "\n            ",
        source,
        flags=re.DOTALL,
    )
    source = re.sub(
        r'\n[ \t]*<a href="\.\./useful\.html" class="article-back">.*?</a>\n?',
        "\n        ",
        source,
        flags=re.DOTALL,
    )

    source = re.sub(
        r'\n[ \t]*<p class="service-hero__label">',
        '\n            <p class="service-hero__label">',
        source,
        count=1,
    )
    title = ROOT_TITLES.get(relative_path, page_title(source))
    items = breadcrumb_items(relative_path, title)
    main = re.search(r"<main\b[^>]*>", source, flags=re.IGNORECASE)
    if not main:
        raise ValueError(f"{relative_path}: страница не содержит main")

    after_main = re.sub(r"^\s*", "\n    ", source[main.end() :], count=1)
    source = source[: main.end()] + render_breadcrumbs(items) + after_main
    source = source.replace("</head>", f"{render_schema(items)}</head>", 1)
    return source


def main():
    pages = sorted(ROOT.glob("*.html")) + sorted((ROOT / "services").glob("*.html"))
    pages += sorted((ROOT / "articles").glob("*.html"))
    for path in pages:
        if path.name.startswith("_"):
            continue
        relative_path = path.relative_to(ROOT).as_posix()
        updated = apply_breadcrumbs(path.read_text(encoding="utf-8"), relative_path)
        path.write_text(updated, encoding="utf-8")
        if relative_path != "index.html":
            print(f"Breadcrumbs: {relative_path}")


if __name__ == "__main__":
    main()
