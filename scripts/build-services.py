#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Генератор страниц услуг и обновление навигации LS Detailing."""

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SCRIPTS = Path(__file__).resolve().parent
SERVICES_DIR = ROOT / "services"

sys.path.insert(0, str(SCRIPTS))

from site_common import (  # noqa: E402
    MAP_IFRAME,
    SOCIALS,
    render_site_header,
    service_href,
)
from services_data import CATEGORIES, SERVICES  # noqa: E402
from stage_icons import (  # noqa: E402
    SERVICES_PAGE_HERO,
    hero_image_for,
    infer_stage_icon,
    stage_icon_svg,
)

ROOT_PAGES = {
    "index.html": "index",
    "services.html": "services",
    "works.html": "works",
    "useful.html": "useful",
    "about.html": "about",
    "contacts.html": "contacts",
}


def merge_stages(stages):
    merged = []
    for stage in stages:
        item = dict(stage)
        item.setdefault("icon", infer_stage_icon(item["title"]))
        merged.append(item)
    return merged


def render_stages(stages):
    items = []
    for i, stage in enumerate(merge_stages(stages), 1):
        num = f"{i:02d}"
        icon = stage_icon_svg(stage["icon"])
        items.append(f"""          <article class="service-stage reveal">
            <div class="service-stage__head">
              <span class="service-stage__num">{num}</span>
              {icon}
              <h3 class="service-stage__title">{stage['title']}</h3>
            </div>
            <p class="service-stage__text">{stage['text']}</p>
          </article>""")
    return "\n".join(items)


def render_faq(faq):
    items = []
    for item in faq:
        items.append(f"""          <details class="service-faq__item reveal">
            <summary class="service-faq__question">{item['q']}</summary>
            <p class="service-faq__answer">{item['a']}</p>
          </details>""")
    return "\n".join(items)


def render_service_page(slug, data):
    stages = render_stages(data["stages"])
    faq = render_faq(data["faq"])
    hero_img = hero_image_for(slug, data["category"])
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{data['excerpt']}">
  <title>{data['title']} — LS Detailing</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../css/styles.css">
</head>
<body>
{render_site_header("../", "services")}
  <main class="page-top">
    <section class="service-hero service-hero--photo" style="background-image: url('../img/services/{hero_img}')">
      <div class="container">
        <a href="../services.html" class="service-back reveal">← Все услуги</a>
        <p class="service-hero__label reveal">{data['category']}</p>
        <h1 class="service-hero__title reveal">{data['title']}</h1>
        <p class="service-hero__intro reveal">{data['intro']}</p>
      </div>
    </section>

    <section class="section service-stages-section">
      <div class="container">
        <div class="section-head reveal">
          <h2 class="section-head__title">Этапы работ</h2>
          <p class="section-head__desc">Прозрачный процесс — от осмотра до выдачи автомобиля</p>
        </div>
        <div class="service-stages">
{stages}
        </div>
      </div>
    </section>

    <section class="section section--soft service-faq-section">
      <div class="container">
        <div class="section-head reveal">
          <h2 class="section-head__title">Частые вопросы</h2>
        </div>
        <div class="service-faq">
{faq}
        </div>
      </div>
    </section>

    <section class="service-cta">
      <div class="container">
        <div class="service-cta__inner reveal">
          <div class="service-cta__content">
            <h2 class="service-cta__title">Хотите придать авто идеальный вид?</h2>
            <p class="service-cta__text">Запишитесь на консультацию — оценим состояние и предложим оптимальное решение без лишних работ.</p>
            <a href="../contacts.html" class="btn btn--dark">Записаться</a>
          </div>
          <div class="service-cta__map">
            <p class="contact-block__label">Как нас найти</p>
            <p class="contact-block__value">Республика Калмыкия, г. Элиста, 10 улица, д. 52</p>
            <p class="contact-block__sub">Ежедневно 10:00–19:00 · <a href="tel:+79618422227" class="contact-block__value--link">+7 (961) 842-22-27</a></p>
            <div class="map-wrap service-cta__map-frame">
              {MAP_IFRAME}
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
  <footer class="footer">
    <div class="container">
      <div class="footer__bottom" style="border-top:none;padding-top:0">
        <p>&copy; 2026 LS Detailing</p>
        <a href="../contacts.html" class="footer__link">Контакты</a>
      </div>
    </div>
  </footer>
  <script src="../js/main.js"></script>
</body>
</html>
"""


def render_services_page():
    sections = []
    num = 0
    for cat in CATEGORIES:
        rows = []
        for svc in cat["services"]:
            num += 1
            data = SERVICES[svc["slug"]]
            href = service_href("", svc["slug"])
            rows.append(f"""          <article class="service-row reveal">
            <span class="service-row__num">{num:02d}</span>
            <div>
              <p class="service-row__cat">{cat['name']}</p>
              <h2 class="service-row__title"><a href="{href}">{data['title']}</a></h2>
              <p class="service-row__text">{data['excerpt']}</p>
            </div>
            <div class="service-row__actions">
              <a href="{href}" class="btn btn--ghost">Подробнее</a>
              <a href="contacts.html" class="btn btn--dark">Записаться</a>
            </div>
          </article>""")
        sections.append("\n".join(rows))

    all_rows = "\n".join(sections)
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="Услуги LS Detailing — оклейка, полировка, химчистка, малярные работы, перетяжка и дооснащение в Элисте.">
  <title>Услуги — LS Detailing</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
{render_site_header(active="services")}
  <main class="page-top">
    <section class="page-hero page-hero--photo" style="background-image: url('img/services/{SERVICES_PAGE_HERO}')">
      <div class="container reveal">
        <p class="page-hero__label">Услуги</p>
        <h1 class="page-hero__title">Полный спектр детейлинга</h1>
        <p class="page-hero__desc">25+ направлений в одном центре — от защиты кузова до перетяжки салона и дооснащения премиум-класса</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="services-list">
{all_rows}
        </div>
      </div>
    </section>

    <section class="cta-banner">
      <div class="container">
        <div class="cta-banner__inner reveal">
          <div>
            <h2 class="cta-banner__title">Не знаете, с чего начать?</h2>
            <p class="cta-banner__text">Опишите состояние автомобиля — мы подберём оптимальный комплекс услуг</p>
          </div>
          <div class="cta-banner__actions">
            <a href="contacts.html" class="btn btn--light">Получить консультацию</a>
          </div>
        </div>
      </div>
    </section>
  </main>
  <footer class="footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <a href="index.html" class="logo"><div class="logo__mark">LS <span>Detailing</span></div></a>
          <p>Премиальный детейлинг-центр в Элисте. Комплексный уход за автомобилем в одном месте.</p>
          <div class="socials socials--footer" style="margin-top:20px">{SOCIALS}</div>
        </div>
        <div><h4 class="footer__heading">Навигация</h4><a href="services.html" class="footer__link">Услуги</a><a href="advantages.html" class="footer__link">Преимущества</a><a href="works.html" class="footer__link">Работы</a><a href="useful.html" class="footer__link">Полезное</a><a href="reviews.html" class="footer__link">Отзывы</a><a href="about.html" class="footer__link">О нас</a><a href="contacts.html" class="footer__link">Контакты</a></div>
        <div><h4 class="footer__heading">Контакты</h4><a href="tel:+79618422227" class="footer__link">+7 (961) 842-22-27</a><p class="footer__link">Республика Калмыкия, г. Элиста, 10 улица, д. 52</p><p class="footer__link">Ежедневно 10:00–19:00</p></div>
      </div>
      <div class="footer__bottom"><p>&copy; 2026 LS Detailing</p><a href="#" class="footer__link">Политика конфиденциальности</a></div>
    </div>
  </footer>
  <script src="js/main.js"></script>
</body>
</html>
"""


def patch_header_in_file(path, prefix="", active=None):
    text = path.read_text(encoding="utf-8")
    new_header = render_site_header(prefix, active)
    pattern = (
        r'(?:<div class="topbar">.*?</div>\s*)?'
        r'<header class="(?:site-header|header)" id="header">.*?</header>'
    )
    if not re.search(pattern, text, re.DOTALL):
        print(f"  SKIP header: {path.name}")
        return False
    new_text = re.sub(pattern, new_header.strip(), text, count=1, flags=re.DOTALL)
    if new_text != text:
        path.write_text(new_text, encoding="utf-8")
        return True
    return False


def sync_all_headers():
    for filename, active in ROOT_PAGES.items():
        path = ROOT / filename
        if path.exists():
            if patch_header_in_file(path, "", active):
                print(f"Patched header: {filename}")

    articles_dir = ROOT / "articles"
    if articles_dir.exists():
        for path in articles_dir.glob("*.html"):
            if patch_header_in_file(path, "../", "useful"):
                print(f"Patched header: articles/{path.name}")


def main():
    SERVICES_DIR.mkdir(parents=True, exist_ok=True)

    for slug, data in SERVICES.items():
        out = SERVICES_DIR / f"{slug}.html"
        out.write_text(render_service_page(slug, data), encoding="utf-8")
        print(f"Written services/{slug}.html")

    services_path = ROOT / "services.html"
    services_path.write_text(render_services_page(), encoding="utf-8")
    print("Written services.html")

    sync_all_headers()
    print("Done.")


if __name__ == "__main__":
    main()
