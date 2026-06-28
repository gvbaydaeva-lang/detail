const reviewsData = [
  {
    id: 1,
    name: 'Евгений Кензеев',
    meta: '4 отзыва · Знаток города 5 уровня',
    date: '19 февраля 2025',
    rating: 5,
    text: 'В феврале 2025 года обратился в LS detailing, для того чтобы убрать со своего автомобиля малярный скотч, так как на новогодние праздники украшал свой автомобиль гирляндами! По телефону меня без проблем записали и назначили дату и время приема моего автомобиля! Принимал мою машину владелец детейлинга Мингиян, подробно рассказал и объяснил какие работы будут проводиться и какой результат мы в итоге получим!\nВ результате все ожидания подтвердились,\nработу сделали очень качественно, сняли клей от малярного скотча, произвели полировку кузова а так же нанесли керамику, в салоне автомобиля произвели химчистку!\nХочу отметить профессионализм и компетентность ребят которые работают данном детейлинге и конечно же самого владельца!\nОднозначно рекомендую LS detailing 👍\nРезультат в прикрепленных фотографиях',
    photos: ['images/reviews/photos/evgeniy_kenzeev_1.jpg', 'images/reviews/photos/evgeniy_kenzeev_2.jpg', 'images/reviews/photos/evgeniy_kenzeev_3.jpg'],
  },
  {
    id: 2,
    name: 'Alma B.',
    meta: '1 отзыв · Знаток города 3 уровня',
    date: '21 ноября 2025',
    rating: 5,
    text: 'Хочу поблагодарить Мингияна и его команду за отличную работу ,которую совершили с моим автомобилем.Очень профессиональные и клиентоориентированные ребята! Мастера своего дела!Устранили негерметичность люка,потолка на моем Range Rover,провели качественную химчистку,полировку и бронь фар!За такую сложную работу по разбору всего салона для устранения проблем с течью воды из люка ,прочистку всех дренажей ,никто из мастеров нашего города не хотел браться ,Мингиян сразу отреагировал и записал на ближ.время!Желаю Мингияну процветания,побольше благодарных клиентов!',
    photos: ['images/reviews/photos/alma_b_1.jpg'],
  },
  {
    id: 3,
    name: 'Чингиз',
    meta: '5 отзывов · Знаток города 4 уровня',
    date: '21 февраля 2025',
    rating: 5,
    text: 'Я обратился в салон с просьбой восстановить свои фары, которые потеряли свою яркость и стали тусклыми от времени. С самого начала меня приятно удивил профессиональный подход команды: специалисты внимательно выслушали мои пожелания, объяснили процесс работы и ответили на все вопросы.\n\nРабота была выполнена на высшем уровне! Фары теперь светят как новые, и я снова вижу дорогу чётко даже в ночное время. Особенно стоит отметить клиентоориентированность сотрудников: они сделали всё возможное, чтобы я остался доволен результатом.\n\nСоветую этот сервис всем, кто хочет вернуть своему автомобилю ухоженный вид и повысить безопасность на дороге. Спасибо за отличную работу!',
    photos: ['images/reviews/photos/chingiz_1.jpg', 'images/reviews/photos/chingiz_2.jpg'],
  },
  {
    id: 4,
    name: 'Баир Болдырев',
    meta: '2 отзыва · Знаток города 3 уровня',
    date: '8 октября 2024',
    rating: 5,
    text: 'Отличные ребята! Сервиз на уровне! Все сделали качественно и быстро! Уже езжу к ним на протяжении 4х лет. 2 авто поменял, после покупки сразу еду к ним на детейлинг. И перед продажей готовил авто.\n+ у них есть база своих мастеров в городе, с которыми вместе работают. Можно оставить авто и сделают комплекс работ.\nСобственник бизнеса постоянно развивается, ездит на обучение и облагораживает территорию возле детейлинга. Недавно сделал дорогу и можно проехать в любую погоду!\nРекомендую Мингияна! 👍\nСкоро приеду для подготовки авто к Зиме.',
    photos: ['images/reviews/photos/bair_boldyrev_1.jpg', 'images/reviews/photos/bair_boldyrev_2.jpg'],
  },
  {
    id: 5,
    name: 'Баир Ш.',
    meta: '1 отзыв · Знаток города 3 уровня',
    date: '7 декабря 2025',
    rating: 5,
    text: 'Ребята мастера своего дела . Делал химчистку салона теперь он как новый.Работой очень доволен ☝️\nВсем рекомендую 👍',
    photos: ['images/reviews/photos/bair_sh_1.jpg'],
  },
  {
    id: 6,
    name: 'Георгий М.',
    meta: '3 отзыва · Знаток города 4 уровня',
    date: '14 декабря 2024',
    rating: 5,
    text: '-Pace\n\nВыражаю благодарность DETAILING Car LS! Хочу отметить профессионализм сотрудников, грамотные консультации, адекватные цены, внимание к мелочам и главное – качественно выполненную работу! Сделали авто – полировка, покрытие керамикой, защитную пленку на фары, химчистка салона, с разбором до металла, мойка двигателя и много чего еще, в подарок сделали лобовое стекло, было повреждение от камня, Антидождь. Автомобиль выглядит как новый :) Рекомендую 100%!',
    photos: ['images/reviews/photos/georgiy_m_1.jpg'],
  },
  {
    id: 7,
    name: 'Нурсултан Нурсултанович',
    meta: '4 отзыва · Знаток города 4 уровня',
    date: '24 февраля 2025',
    rating: 5,
    text: 'Хочу выразить благодарность за такое прекрасное место.\nРегулярно посещаю данный детейлинг.\nСделал здесь себе: 1)Полировку кузова\n2) нанесение керамического состава\n3) обшивка рулевого колеса в напу и многое другое.\nРезультатом доволен сполна .\nСоветую своим друзьям и знакомым это место.\nОгромное спасибо Мингияну\nК делу подходят качественно к каждому клиенту индивидуально.\nФотографии прикрепляю',
    photos: ['images/reviews/photos/nursultan_1.jpg', 'images/reviews/photos/nursultan_2.jpg'],
  },
  {
    id: 8,
    name: 'USDMega',
    meta: '3 отзыва · Знаток города 4 уровня',
    date: '4 марта 2025',
    rating: 5,
    text: 'Отличный сервис! Недавно столкнулся с неприятностью — на парковке кто-то зацепил мою машину, повредив крыло и бампер. Сразу позвонил в этот салон детейлинга, и ребята оперативно отреагировали. Приехал к ним, и буквально через полчаса отполировали повреждения идеально, словно ничего и не было. Очень доволен качеством работы и профессионализмом сотрудников. Рекомендую всем, кто хочет вернуть своему автомобилю первозданный вид!',
    photos: ['images/reviews/photos/usdmega_1.jpg', 'images/reviews/photos/usdmega_2.jpg'],
  },
  {
    id: 9,
    name: 'Shon Sandzhiev',
    meta: '2 отзыва · Знаток города 5 уровня',
    date: '13 февраля',
    rating: 5,
    text: 'Хочу выразить огромную благодарность Detailing Car Ls и лично Мингияну за проделанную работу! Отдавал машину на полный комплекс, и результат превзошел все ожидания.\nОтдельно отмечу подход Мингияна, это настоящий профессионал. Весь процесс сопровождался фото и видеоотчетами. Обо всех нюансах предупреждал заранее, не просто ставил перед фактом, а предлагал грамотные решения.\nВ конце ждал приятный бонус, подарили ручку, воду и табличку для номера. Очень достойный сервис. Рекомендую!',
    photos: ['images/reviews/photos/shon_sandzhiev_1.jpg', 'images/reviews/photos/shon_sandzhiev_2.jpg', 'images/reviews/photos/shon_sandzhiev_3.jpg', 'images/reviews/photos/shon_sandzhiev_4.jpg'],
  },
];

const STAR_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01z"/></svg>';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getAvatarInitial(name) {
  const match = String(name).trim().match(/\p{L}/u);
  return match ? match[0].toUpperCase() : '?';
}

function resolveReviewPhoto(path) {
  if (!path) return '';
  const trimmed = path.trim();
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('/')) return trimmed;
  return trimmed;
}

function getReviewPhotos(review) {
  return (review.photos || []).map(resolveReviewPhoto).filter(Boolean);
}

function renderStars(rating) {
  return STAR_SVG.repeat(rating);
}

function renderReviewCard(review) {
  const initial = getAvatarInitial(review.name);
  return `
    <article class="review-card" data-review-id="${review.id}" itemscope itemtype="https://schema.org/Review">
      <div class="rc-top">
        <div class="rc-avatar" aria-hidden="true">${escapeHtml(initial)}</div>
        <div>
          <div class="rc-name" itemprop="author">${escapeHtml(review.name)}</div>
          <div class="rc-meta">${escapeHtml(review.meta)}</div>
        </div>
      </div>
      <div class="rc-stars" aria-label="${review.rating} из 5">${renderStars(review.rating)}</div>
      <p class="review-card__text" itemprop="reviewBody">${escapeHtml(review.text)}</p>
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
  const columns = splitIntoColumns(reviewsData, 3);
  grid.innerHTML = columns
    .map((col) => `<div class="col">${col.map(renderReviewCard).join('')}</div>`)
    .join('');
}

function initReviewPhotoLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');

  if (!lightbox || !lightboxImg) return null;

  let photos = [];
  let current = 0;
  let caption = '';

  const show = (index) => {
    current = index;
    lightboxImg.src = photos[current];
    lightboxImg.alt = caption ? `${caption} — фото ${current + 1}` : '';
    lightbox.classList.add('lightbox--active');
  };

  const close = () => {
    lightbox.classList.remove('lightbox--active');
    lightboxImg.removeAttribute('src');
  };

  closeBtn?.addEventListener('click', close);
  prevBtn?.addEventListener('click', () => {
    if (!photos.length) return;
    show((current - 1 + photos.length) % photos.length);
  });
  nextBtn?.addEventListener('click', () => {
    if (!photos.length) return;
    show((current + 1) % photos.length);
  });
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('lightbox--active')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prevBtn?.click();
    if (e.key === 'ArrowRight') nextBtn?.click();
  });

  return (photoList, startIndex, name) => {
    photos = photoList;
    caption = name || '';
    show(startIndex);
  };
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
  const modalDate = document.getElementById('reviewModalDate');
  const modalStars = document.getElementById('reviewModalStars');
  const modalText = document.getElementById('reviewModalText');
  const modalPhotos = document.getElementById('reviewModalPhotos');

  if (!grid || !modal) return;

  renderReviewsGrid(grid);

  const reviewsById = Object.fromEntries(reviewsData.map((review) => [String(review.id), review]));
  const openPhotoLightbox = initReviewPhotoLightbox();

  const closeModal = () => {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  const openModal = (id) => {
    const review = reviewsById[String(id)];
    if (!review) return;

    modalAvatar.textContent = getAvatarInitial(review.name);
    modalName.textContent = review.name;
    modalMeta.textContent = review.meta;
    modalDate.textContent = review.date;
    modalStars.innerHTML = renderStars(review.rating);
    modalStars.setAttribute('aria-label', `${review.rating} из 5`);
    modalText.textContent = review.text;

    const photoUrls = getReviewPhotos(review);
    modalPhotos.replaceChildren();
    if (photoUrls.length) {
      photoUrls.forEach((src, index) => {
        const img = document.createElement('img');
        img.className = 'review-modal__photo';
        img.src = src;
        img.alt = `${review.name} — фото ${index + 1}`;
        img.loading = 'lazy';
        img.addEventListener('click', (e) => {
          e.stopPropagation();
          openPhotoLightbox?.(photoUrls, index, review.name);
        });
        modalPhotos.appendChild(img);
      });
      modalPhotos.hidden = false;
    } else {
      modalPhotos.hidden = true;
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
