const REVIEWS = [
  {
    id: 'alma-b',
    name: 'Alma B.',
    meta: 'Знаток города 3 уровня · 21 ноября 2025',
    rating: 5,
    avatar: 'A',
    text: 'Благодарю Мингияна и его команду за отличную работу с Range Rover. Устранили протечку люка, сделали химчистку, полировку и оклейку фар защитной плёнкой. Профессионалы своего дела, очень клиентоориентированный подход. Рекомендую!',
    photo: 'img/reviews/review-02.png',
    photoAlt: 'Range Rover после детейлинга',
  },
  {
    id: 'evgeniy-kenzeev',
    name: 'Евгений Кензеев',
    meta: 'Знаток города 5 уровня · 19 февраля 2025',
    rating: 5,
    avatar: 'Е',
    text: 'Обратился в LS Detailing, чтобы снять малярный скотч с кузова. Владелец Мингиян лично проконсультировал и подобрал оптимальный вариант работ. Сделали полировку кузова, нанесли керамическое покрытие и провели химчистку салона. Всё на высшем уровне — видно, что люди знают своё дело. Однозначно рекомендую LS detailing.',
    photo: 'img/reviews/review-01.png',
    photoAlt: 'BMW E30 после полировки',
  },
  {
    id: 'bair-sh',
    name: 'Баир Ш.',
    meta: 'Знаток города 3 уровня · 7 декабря 2025',
    rating: 5,
    avatar: 'Б',
    text: 'Ребята мастера своего дела. Делал химчистку салона — теперь он как новый. Работой очень доволен. Всем рекомендую!',
    photo: 'img/reviews/review-05.png',
    photoAlt: 'Jeep после химчистки салона',
  },
  {
    id: 'georgiy-m',
    name: 'Георгий М.',
    meta: 'Знаток города 4 уровня · 14 декабря 2024',
    rating: 5,
    avatar: 'Г',
    text: 'Огромная благодарность DETAILING Car LS! Профессиональные консультации, адекватные цены и безупречное качество. Сделали полировку, керамику, защитную плёнку на фары, химчистку салона с разбором до металла, мойку двигателя. В подарок обработали лобовое «Антидождём». Машина выглядит как новая. Рекомендую 100%!',
    photo: 'img/reviews/review-06.png',
    photoAlt: 'Toyota Camry после детейлинга',
  },
  {
    id: 'nursultan',
    name: 'Нурсултан Нурсултанович',
    meta: 'Знаток города 4 уровня · 24 февраля 2025',
    rating: 5,
    avatar: 'Н',
    text: 'Отличная работа: полировка кузова, нанесение керамического состава и обшивка рулевого колеса в натуру. Отдельное спасибо Мингияну за внимание к деталям. Буду рекомендовать друзьям и знакомым.',
    photo: 'img/reviews/review-07.png',
    photoAlt: 'Toyota после полировки',
  },
  {
    id: 'bair-boldyrev',
    name: 'Баир Болдырев',
    meta: 'Знаток города 3 уровня · 8 октября 2024',
    rating: 5,
    avatar: 'Б',
    text: 'Пользуюсь услугами уже 4 года — качество и скорость на высоте. Владелец постоянно улучшает студию, видно, что ему не всё равно. Каждый раз машина уезжает в идеальном состоянии. Рекомендую всем, кто ценит профессиональный детейлинг в Элисте.',
    photo: 'img/reviews/review-04.png',
    photoAlt: 'Toyota Highlander и Volkswagen Jetta',
  },
  {
    id: 'chingiz',
    name: 'Чингиз',
    meta: 'Знаток города 4 уровня · 21 февраля 2025',
    rating: 5,
    avatar: 'Ч',
    text: 'Приехал восстановить помутневшие фары — команда подошла профессионально, всё объяснили по этапам. Сервис действительно клиентоориентированный. Фары теперь как новые, ночью видимость отличная. Очень рекомендую!',
    photo: 'img/reviews/review-03.png',
    photoAlt: 'Восстановленные фары',
  },
  {
    id: 'usdmega',
    name: 'USDMega',
    meta: 'Знаток города 4 уровня · 4 марта 2025',
    rating: 5,
    avatar: 'U',
    text: 'На парковке задели крыло и бампер. Ребята из LS Detailing откликнулись сразу и за полчаса отполировали повреждение — следов почти не осталось. Быстро, аккуратно, без лишних слов.',
    photo: 'img/reviews/review-08.png',
    photoAlt: 'Крыло после полировки',
  },
  {
    id: 'shon-sandzhiev',
    name: 'Shon Sandzhiev',
    meta: 'Знаток города 5 уровня · 13 февраля 2025',
    rating: 5,
    avatar: 'S',
    text: 'Заказал полный комплекс в Detailing Car LS у Мингияна — результат превзошёл ожидания. Профессиональный подход, фото- и видеоотчёты на каждом этапе. В подарок — ручка, вода и рамка номера. Очень достойный сервис, рекомендую!',
    photo: 'img/reviews/review-09.png',
    photoAlt: 'Toyota Camry после детейлинга',
  },
];

const STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>';

function renderStars(rating) {
  return STAR_SVG.repeat(rating);
}

function renderReviewCard(review) {
  return `
    <article class="review-card" data-review-id="${review.id}" itemscope itemtype="https://schema.org/Review">
      <div class="rc-top">
        <div class="rc-avatar" aria-hidden="true">${review.avatar}</div>
        <div>
          <div class="rc-name" itemprop="author">${review.name}</div>
          <div class="rc-meta">${review.meta}</div>
        </div>
      </div>
      <div class="rc-stars" aria-label="${review.rating} из 5">${renderStars(review.rating)}</div>
      <p class="review-card__text" itemprop="reviewBody">${review.text}</p>
      <button type="button" class="review-card__more" data-review-id="${review.id}">Читать полностью →</button>
    </article>
  `;
}

function splitIntoColumns(items, columnCount) {
  const perCol = Math.ceil(items.length / columnCount);
  const columns = [];
  for (let i = 0; i < columnCount; i += 1) {
    columns.push(items.slice(i * perCol, (i + 1) * perCol));
  }
  return columns;
}

function renderReviewsGrid(grid) {
  const columns = splitIntoColumns(REVIEWS, 3);
  grid.innerHTML = columns
    .map((col) => `<div class="col">${col.map(renderReviewCard).join('')}</div>`)
    .join('');
}

let reviewsPageInitialized = false;

function initReviewsPage() {
  if (reviewsPageInitialized) return;
  reviewsPageInitialized = true;

  const grid = document.getElementById('reviewsGrid');
  const modal = document.getElementById('reviewModal');
  const overlay = document.getElementById('reviewModalOverlay');
  const closeBtn = document.getElementById('reviewModalClose');
  const modalAvatar = document.getElementById('reviewModalAvatar');
  const modalName = document.getElementById('reviewModalName');
  const modalMeta = document.getElementById('reviewModalMeta');
  const modalStars = document.getElementById('reviewModalStars');
  const modalText = document.getElementById('reviewModalText');
  const modalPhotoWrap = document.getElementById('reviewModalPhotoWrap');
  const modalPhoto = document.getElementById('reviewModalPhoto');

  if (!grid || !modal) return;

  renderReviewsGrid(grid);

  const reviewsById = Object.fromEntries(REVIEWS.map((review) => [review.id, review]));

  const closeModal = () => {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  const openModal = (id) => {
    const review = reviewsById[id];
    if (!review) return;

    modalAvatar.textContent = review.avatar;
    modalName.textContent = review.name;
    modalMeta.textContent = review.meta;
    modalStars.innerHTML = renderStars(review.rating);
    modalStars.setAttribute('aria-label', `${review.rating} из 5`);
    modalText.textContent = review.text;

    if (review.photo) {
      modalPhoto.src = review.photo;
      modalPhoto.alt = review.photoAlt || '';
      modalPhotoWrap.style.display = 'block';
    } else {
      modalPhoto.removeAttribute('src');
      modalPhoto.alt = '';
      modalPhotoWrap.style.display = 'none';
    }

    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  const onReviewOpen = (e) => {
    const trigger = e.target.closest('[data-review-id]');
    if (!trigger) return;
    e.preventDefault();
    openModal(trigger.dataset.reviewId);
  };

  grid.addEventListener('click', onReviewOpen);

  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });
}
