#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Добавляет canonical/Schema.org и обновляет robots.txt/sitemap.xml."""

import html as html_lib
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BASE_URL = "https://ls-detailing.ru"


def text_match(pattern, source, default=""):
    match = re.search(pattern, source, re.IGNORECASE | re.DOTALL)
    if not match:
        return default
    value = re.sub(r"<[^>]+>", " ", match.group(1))
    return html_lib.unescape(re.sub(r"\s+", " ", value).strip())


def canonical_url(path):
    relative = path.relative_to(ROOT).as_posix()
    return f"{BASE_URL}/" if relative == "index.html" else f"{BASE_URL}/{relative}"


def page_schema(path, source, url):
    title = text_match(r"<title[^>]*>(.*?)</title>", source, "LS Detailing")
    description = text_match(
        r'<meta[^>]+name=["\']description["\'][^>]+content=["\'](.*?)["\']',
        source,
    )
    heading = text_match(r"<h1[^>]*>(.*?)</h1>", source, title.split("—")[0].strip())
    relative = path.relative_to(ROOT).as_posix()

    business = {
        "@type": "AutoRepair",
        "@id": f"{BASE_URL}/#business",
        "name": "LS Detailing",
        "url": f"{BASE_URL}/",
        "image": f"{BASE_URL}/images/hero-main-1920.webp",
        "telephone": "+7-961-842-22-27",
        "priceRange": "₽₽",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Элиста",
            "addressRegion": "Республика Калмыкия",
            "streetAddress": "10-я улица, 52",
            "addressCountry": "RU",
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": 46.286834,
            "longitude": 44.257262,
        },
        "openingHoursSpecification": {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
                "Sunday",
            ],
            "opens": "10:00",
            "closes": "19:00",
        },
        "sameAs": [
            "https://yandex.com/maps/-/CTQgrE~F",
            "https://www.instagram.com/detailing_car_ls",
        ],
    }
    webpage = {
        "@type": "WebPage",
        "@id": f"{url}#webpage",
        "url": url,
        "name": title,
        "description": description,
        "inLanguage": "ru-RU",
        "isPartOf": {"@id": f"{BASE_URL}/#website"},
        "about": {"@id": f"{BASE_URL}/#business"},
    }
    graph = [
        {
            "@type": "WebSite",
            "@id": f"{BASE_URL}/#website",
            "url": f"{BASE_URL}/",
            "name": "LS Detailing",
            "inLanguage": "ru-RU",
            "publisher": {"@id": f"{BASE_URL}/#business"},
        },
        business,
        webpage,
    ]

    if relative.startswith("services/"):
        graph.append(
            {
                "@type": "Service",
                "@id": f"{url}#service",
                "name": heading,
                "description": description,
                "url": url,
                "serviceType": heading,
                "areaServed": {
                    "@type": "City",
                    "name": "Элиста",
                },
                "provider": {"@id": f"{BASE_URL}/#business"},
            }
        )
        webpage["mainEntity"] = {"@id": f"{url}#service"}
    elif relative.startswith("articles/"):
        image = text_match(
            r'<div[^>]+class=["\'][^"\']*article-page__hero[^"\']*["\'][^>]*>.*?<img[^>]+src=["\'](.*?)["\']',
            source,
        )
        if image.startswith("../"):
            image = f"{BASE_URL}/{image[3:]}"
        graph.append(
            {
                "@type": "Article",
                "@id": f"{url}#article",
                "headline": heading,
                "description": description,
                "image": image,
                "inLanguage": "ru-RU",
                "mainEntityOfPage": {"@id": f"{url}#webpage"},
                "author": {"@id": f"{BASE_URL}/#business"},
                "publisher": {"@id": f"{BASE_URL}/#business"},
            }
        )
        webpage["mainEntity"] = {"@id": f"{url}#article"}

    return {"@context": "https://schema.org", "@graph": graph}


def patch_page(path):
    source = path.read_text(encoding="utf-8")
    url = canonical_url(path)
    source = re.sub(
        r'\s*<link[^>]+rel=["\']canonical["\'][^>]*>',
        "",
        source,
        flags=re.IGNORECASE,
    )
    source = re.sub(
        r'\s*<script[^>]+data-seo-graph[^>]*>.*?</script>',
        "",
        source,
        flags=re.IGNORECASE | re.DOTALL,
    )
    payload = json.dumps(page_schema(path, source, url), ensure_ascii=False, indent=2)
    seo = (
        f'\n  <link rel="canonical" href="{url}">\n'
        f'  <script type="application/ld+json" data-seo-graph>\n{payload}\n  </script>\n'
    )
    source = source.replace("</head>", f"{seo}</head>", 1)
    path.write_text(source, encoding="utf-8")


def html_pages():
    paths = list(ROOT.glob("*.html"))
    paths += list((ROOT / "services").glob("*.html"))
    paths += list((ROOT / "articles").glob("*.html"))
    return sorted(path for path in paths if path.stat().st_size and not path.name.startswith("_"))


def write_sitemap(paths):
    today = date.today().isoformat()
    entries = "\n".join(
        f"  <url><loc>{canonical_url(path)}</loc><lastmod>{today}</lastmod></url>"
        for path in paths
    )
    content = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        f"{entries}\n"
        "</urlset>\n"
    )
    (ROOT / "sitemap.xml").write_text(content, encoding="utf-8")
    (ROOT / "robots.txt").write_text(
        "User-agent: *\nAllow: /\n\n"
        f"Sitemap: {BASE_URL}/sitemap.xml\n",
        encoding="utf-8",
    )


def main():
    paths = html_pages()
    for path in paths:
        patch_page(path)
        print(f"SEO: {path.relative_to(ROOT)}")
    write_sitemap(paths)
    print(f"Written sitemap.xml ({len(paths)} URLs) and robots.txt")


if __name__ == "__main__":
    main()
