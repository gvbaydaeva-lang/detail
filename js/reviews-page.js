const REVIEWS = [
  {
    name: 'Alma B.',
    meta: 'Знаток города 3 уровня · 21 ноября 2025',
    fullText: [
      'Благодарю Мингияна и его команду за отличную работу с Range Rover. Устранили протечку люка, сделали химчистку, полировку и оклейку фар защитной плёнкой. Профессионалы своего дела, очень клиентоориентированный подход. Рекомендую!',
    ],
    photos: [{ src: 'img/reviews/review-02.png', alt: 'Range Rover после детейлинга' }],
  },
  {
    name: 'Евгений Кензеев',
    meta: 'Знаток города 5 уровня · 19 февраля 2025',
    fullText: [
      'Обратился в LS Detailing, чтобы снять малярный скотч с кузова. Владелец Мингиян лично проконсультировал и подобрал оптимальный вариант работ.',
      'Сделали полировку кузова, нанесли керамическое покрытие и провели химчистку салона. Всё на высшем уровне — видно, что люди знают своё дело.',
      'Однозначно рекомендую LS detailing 👍 Результат в прикреплённых фотографиях.',
    ],
    photos: [{ src: 'img/reviews/review-01.png', alt: 'BMW E30 после полировки' }],
  },
  {
    name: 'Баир Ш.',
    meta: 'Знаток города 3 уровня · 7 декабря 2025',
    fullText: [
      'Ребята мастера своего дела. Делал химчистку салона — теперь он как новый. Работой очень доволен ☝️ Всем рекомендую 👍',
    ],
    photos: [{ src: 'img/reviews/review-05.png', alt: 'Jeep после химчистки салона' }],
  },
  {
    name: 'Георгий М.',
    meta: 'Знаток города 4 уровня · 14 декабря 2024',
    fullText: [
      'Огромная благодарность DETAILING Car LS! Профессиональные консультации, адекватные цены и безупречное качество работ.',
      'Сделали полировку, керамическое покрытие, защитную плёнку на фары, химчистку салона с разбором до металла, мойку двигателя. В подарок обработали лобовое стекло составом «Антидождь».',
      'Машина выглядит как новая :) Рекомендую 100%!',
    ],
    photos: [{ src: 'img/reviews/review-06.png', alt: 'Toyota Camry после детейлинга' }],
  },
  {
    name: 'Нурсултан Нурсултанович',
    meta: 'Знаток города 4 уровня · 24 февраля 2025',
    fullText: [
      'Отличная работа: полировка кузова, нанесение керамического состава и обшивка рулевого колеса в натуру.',
      'Отдельное спасибо Мингияну за внимание к деталям и профессиональный подход. Буду рекомендовать друзьям и знакомым.',
    ],
    photos: [{ src: 'img/reviews/review-07.png', alt: 'Toyota после полировки' }],
  },
  {
    name: 'Баир Болдырев',
    meta: 'Знаток города 3 уровня · 8 октября 2024',
    fullText: [
      'Пользуюсь услугами LS Detailing уже 4 года — качество и скорость работы всегда на высоте.',
      'Владелец постоянно улучшает студию и оборудование, видно, что ему действительно не всё равно. Каждый раз машина уезжает в идеальном состоянии.',
      'Рекомендую всем, кто ценит профессиональный детейлинг в Элисте 👍',
    ],
    photos: [{ src: 'img/reviews/review-04.png', alt: 'Toyota Highlander и Volkswagen Jetta' }],
  },
  {
    name: 'Чингиз',
    meta: 'Знаток города 4 уровня · 21 февраля 2025',
    fullText: [
      'Приехал восстановить помутневшие и пожелтевшие фары. Команда подошла профессионально, всё объяснили по этапам работ.',
      'Сервис действительно клиентоориентированный — чувствуется забота о клиенте. Фары теперь как новые, ночью видимость стала намного лучше.',
      'Очень рекомендую LS Detailing!',
    ],
    photos: [{ src: 'img/reviews/review-03.png', alt: 'Восстановленные фары' }],
  },
  {
    name: 'USDMega',
    meta: 'Знаток города 4 уровня · 4 марта 2025',
    fullText: [
      'На парковке кто-то задел машину — повредили крыло и бампер. Обратился в LS Detailing.',
      'Ребята откликнулись сразу и буквально за полчаса отполировали повреждение — следов почти не осталось. Быстро, аккуратно, без лишних слов. Спасибо!',
    ],
    photos: [{ src: 'img/reviews/review-08.png', alt: 'Крыло после полировки' }],
  },
  {
    name: 'Shon Sandzhiev',
    meta: 'Знаток города 5 уровня · 13 февраля 2025',
    fullText: [
      'Заказал полный комплекс услуг в Detailing Car LS у Мингияна — результат превзошёл все ожидания.',
      'Профессиональный подход, фото- и видеоотчёты на каждом этапе работ. Приятный бонус — ручка, вода и рамка для номера.',
      'Очень достойный сервис. Рекомендую!',
    ],
    photos: [{ src: 'img/reviews/review-09.png', alt: 'Toyota Camry после детейлинга' }],
  },
];

const STARS_HTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>'.repeat(5);

let reviewsPageInitialized = false;

function initReviewsPage() {
  if (reviewsPageInitialized) return;
  reviewsPageInitialized = true;

  const grid = document.getElementById('reviewsGrid');
  const mobile = document.getElementById('reviewsMobile');
  const overlay = document.getElementById('reviewModalOverlay');
  const modalBox = document.getElementById('reviewModalBox');

  if (!grid || !overlay || !modalBox) return;

  const cards = grid.querySelectorAll('.review-card');
  cards.forEach((card, i) => {
    card.dataset.index = String(i);
  });

  if (mobile && cards.length) {
    mobile.replaceChildren();
    cards.forEach((card) => {
      mobile.appendChild(card.cloneNode(true));
    });
  }

  const closeModal = () => {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  const openModal = (index) => {
    const review = REVIEWS[index];
    if (!review) return;

    const avatar = review.name.charAt(0).toUpperCase() || '?';
    const textHtml = review.fullText.map((p) => `<p>${p}</p>`).join('');
    const photosHtml = review.photos
      .map((photo) => `<img src="${photo.src}" alt="${photo.alt}" loading="lazy">`)
      .join('');

    modalBox.innerHTML = `
      <button class="modal-close" type="button" aria-label="Закрыть">&times;</button>
      <div class="rc-top">
        <div class="rc-avatar" aria-hidden="true">${avatar}</div>
        <div>
          <div class="rc-name">${review.name}</div>
          <div class="rc-meta">${review.meta}</div>
        </div>
      </div>
      <div class="rc-stars" aria-label="5 из 5">${STARS_HTML}</div>
      <div class="rc-text rc-text--modal">${textHtml}</div>
      ${photosHtml ? `<div class="rc-photos rc-photos--modal">${photosHtml}</div>` : ''}
    `;

    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const onCardClick = (e) => {
    const card = e.target.closest('.review-card');
    if (!card) return;
    const index = Number.parseInt(card.dataset.index, 10);
    if (Number.isNaN(index)) return;
    e.preventDefault();
    openModal(index);
  };

  grid.addEventListener('click', onCardClick);
  mobile?.addEventListener('click', onCardClick);

  modalBox.addEventListener('click', (e) => {
    if (e.target.closest('.modal-close')) closeModal();
  });

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) closeModal();
  });
}
