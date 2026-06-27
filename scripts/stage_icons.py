# -*- coding: utf-8 -*-
"""Line-иконки этапов работ и привязка фото-обложек к категориям услуг."""

STAGE_ICON_SVGS = {
    "inspect": (
        '<circle cx="11" cy="11" r="8"/>'
        '<path d="m21 21-4.35-4.35"/>'
        '<path d="M11 8v6"/><path d="M8 11h6"/>'
    ),
    "consult": (
        '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>'
    ),
    "prep": (
        '<path d="M12 20h9"/>'
        '<path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>'
    ),
    "wash": (
        '<path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>'
    ),
    "polish": (
        '<path d="m12 3-1.9 5.8H4.2L9.5 12l-1.9 5.8L12 15.6l4.4 2.2-1.9-5.8 5.3-3.2h-6.9L12 3Z"/>'
    ),
    "apply": (
        '<path d="m18.37 2.63 4 4L5.5 23.5 1 22l1.5-4.5Z"/>'
        '<path d="m14 6 4 4"/>'
    ),
    "protect": (
        '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
        '<path d="m9 12 2 2 4-4"/>'
    ),
    "check": (
        '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>'
        '<path d="m9 11 3 3L22 4"/>'
    ),
    "disassemble": (
        '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>'
    ),
    "install": (
        '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>'
        '<path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>'
    ),
    "paint": (
        '<path d="M18.37 2.63 22 6.25l-8.59 8.59a2 2 0 0 1-2.82 0l-.71-.71a2 2 0 0 1 0-2.82L18.37 2.63Z"/>'
        '<path d="m2 22 5-5"/>'
    ),
    "sew": (
        '<circle cx="6" cy="6" r="3"/>'
        '<path d="M8.12 8.12 12 12"/>'
        '<path d="M20 4 8.12 15.88"/>'
        '<circle cx="6" cy="18" r="3"/>'
        '<path d="M8.12 15.88 12 12"/>'
    ),
    "wiring": (
        '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>'
    ),
    "dry": (
        '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/>'
        '<path d="M9.6 4.6A2 2 0 1 1 11 8H2"/>'
        '<path d="M12.6 19.4A2 2 0 1 0 14 16H2"/>'
    ),
    "cut": (
        '<circle cx="6" cy="6" r="3"/>'
        '<circle cx="6" cy="18" r="3"/>'
        '<path d="M20 4 8.12 15.88"/>'
        '<path d="M14.47 14.48 20 20"/>'
        '<path d="M8.12 8.12 12 12"/>'
    ),
}

CATEGORY_HERO_IMAGES = {
    "Оклейка плёнкой": "keramika-zashchita.jpg",
    "Полировка": "polirovka-kuzova.jpg",
    "Детейлинг-уход": "deteyling-moyka.jpg",
    "Малярные работы": "polirovka-kuzova.jpg",
    "Перетяжка и реставрация": "himchistka.jpg",
    "Дооснащение": "shumoizolyatsiya.jpg",
}

SERVICE_HERO_OVERRIDES = {
    "himchistka-salona": "himchistka.jpg",
    "polirovka-detaley-salona": "himchistka.jpg",
    "pereyazhka-salona": "himchistka.jpg",
    "pereyazhka-rulya": "himchistka.jpg",
    "pereyazhka-sideniy": "himchistka.jpg",
    "zvezdnoye-nebo": "himchistka.jpg",
    "shumoizolyatsiya": "shumoizolyatsiya.jpg",
    "bronirovanie-lobovogo": "tonirovka.jpg",
    "multimediya": "tonirovka.jpg",
    "chistka-radiatora": "deteyling-moyka.jpg",
    "chistka-podkapotnogo": "deteyling-moyka.jpg",
    "deteyling-mototsiklov": "deteyling-moyka.jpg",
    "uhod-krysha-kabrioleta": "deteyling-moyka.jpg",
    "karbon": "keramika-zashchita.jpg",
    "setka-radiatora": "deteyling-moyka.jpg",
}

SERVICES_PAGE_HERO = "polirovka-kuzova.jpg"


def hero_image_for(slug, category):
    return SERVICE_HERO_OVERRIDES.get(slug, CATEGORY_HERO_IMAGES.get(category, "polirovka-kuzova.jpg"))


def infer_stage_icon(title):
    t = title.lower()
    rules = (
        (("осмотр", "диагност", "оценк", "тест"), "inspect"),
        (("консультац", "проектир", "планир", "подбор", "эскиз"), "consult"),
        (("разбор", "демонтаж", "снятие", "доступ"), "disassemble"),
        (("монтаж", "установ", "сборк", "укладк"), "install"),
        (("пошив", "раскрой", "перетяж", "натяжен"), "sew"),
        (("покраск", "окраск", "лак"), "paint"),
        (("провод", "оптик", "подключ", "электр"), "wiring"),
        (("сушк", "продув"), "dry"),
        (("мойк", "промыв", "очист", "чистк", "экстрак"), "wash"),
        (("полиров", "коррекц"), "polish"),
        (("нанесен", "импрегн", "обработк", "слой"), "apply"),
        (("защит", "консервац", "брон"), "protect"),
        (("контрол", "проверк", "приёмк", "тестир", "финиш", "настрой"), "check"),
        (("подготов", "грунт", "шлиф"), "prep"),
        (("выправлен", "pdr"), "apply"),
        (("сверлен", "разметк"), "cut"),
    )
    for keywords, icon in rules:
        if any(k in t for k in keywords):
            return icon
    return "check"


def stage_icon_svg(icon_name):
    paths = STAGE_ICON_SVGS.get(icon_name, STAGE_ICON_SVGS["check"])
    return (
        f'<svg class="service-stage__icon" width="36" height="36" viewBox="0 0 24 24" '
        f'fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" '
        f'stroke-linejoin="round" aria-hidden="true">{paths}</svg>'
    )
