document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initServicesDropdown();
  initMobileNav();
  initScrollReveal();
  initLightbox();
  initForm();
  initCounters();
  initPhoneMask();
});

function initHeader() {
  const header = document.getElementById('header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('header--scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initServicesDropdown() {
  const dropdown = document.getElementById('navServices');
  if (!dropdown) return;

  const trigger = dropdown.querySelector('.nav__dropdown-trigger');
  const panel = dropdown.querySelector('.nav__dropdown-panel');
  const catBtns = dropdown.querySelectorAll('.nav__dropdown-cat-btn');
  const isDesktop = () => window.matchMedia('(min-width: 769px)').matches;

  const close = () => {
    dropdown.classList.remove('nav__dropdown--open');
    trigger?.setAttribute('aria-expanded', 'false');
    panel?.setAttribute('hidden', '');
    dropdown.querySelectorAll('.nav__dropdown-cat').forEach((c) => c.classList.remove('nav__dropdown-cat--open'));
  };

  const open = () => {
    dropdown.classList.add('nav__dropdown--open');
    trigger?.setAttribute('aria-expanded', 'true');
    panel?.removeAttribute('hidden');
  };

  trigger?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (dropdown.classList.contains('nav__dropdown--open')) close();
    else open();
  });

  catBtns.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      if (isDesktop()) return;
      e.preventDefault();
      e.stopPropagation();
      const cat = btn.closest('.nav__dropdown-cat');
      const isOpen = cat?.classList.contains('nav__dropdown-cat--open');
      dropdown.querySelectorAll('.nav__dropdown-cat').forEach((c) => c.classList.remove('nav__dropdown-cat--open'));
      if (!isOpen) cat?.classList.add('nav__dropdown-cat--open');
      btn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
    });
  });

  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) close();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}

function initMobileNav() {
  const burger = document.getElementById('burger');
  const nav = document.getElementById('nav');
  if (!burger || !nav) return;

  const closeNav = () => {
    burger.classList.remove('burger--active');
    nav.classList.remove('nav--open');
    document.body.style.overflow = '';
    const dropdown = document.getElementById('navServices');
    if (dropdown) {
      dropdown.classList.remove('nav__dropdown--open');
      dropdown.querySelector('.nav__dropdown-panel')?.setAttribute('hidden', '');
      dropdown.querySelector('.nav__dropdown-trigger')?.setAttribute('aria-expanded', 'false');
    }
  };

  burger.addEventListener('click', () => {
    burger.classList.toggle('burger--active');
    nav.classList.toggle('nav--open');
    document.body.style.overflow = nav.classList.contains('nav--open') ? 'hidden' : '';
  });

  nav.querySelectorAll('.nav__link:not(.nav__dropdown-trigger), .nav__dropdown-link, .nav__dropdown-all').forEach((link) => {
    link.addEventListener('click', closeNav);
  });
}

function initScrollReveal() {
  const elements = document.querySelectorAll('.reveal');
  if (!elements.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('reveal--visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -32px 0px' }
  );

  elements.forEach((el) => observer.observe(el));
}

function initLightbox() {
  const items = document.querySelectorAll('[data-lightbox]');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');

  if (!items.length || !lightbox) return;

  let current = 0;
  const images = Array.from(items).map((el) => ({
    src: el.dataset.lightbox || el.querySelector('img')?.src,
    alt: el.querySelector('img')?.alt || '',
  }));

  const open = (i) => {
    current = i;
    lightboxImg.src = images[current].src.replace(/w=\d+/, 'w=1400');
    lightboxImg.alt = images[current].alt;
    lightbox.classList.add('lightbox--active');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    lightbox.classList.remove('lightbox--active');
    document.body.style.overflow = '';
  };

  items.forEach((item, i) => item.addEventListener('click', () => open(i)));
  closeBtn?.addEventListener('click', close);
  prevBtn?.addEventListener('click', () => { current = (current - 1 + images.length) % images.length; open(current); });
  nextBtn?.addEventListener('click', () => { current = (current + 1) % images.length; open(current); });
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('lightbox--active')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') prevBtn?.click();
    if (e.key === 'ArrowRight') nextBtn?.click();
  });
}

function initForm() {
  const form = document.getElementById('consultForm');
  const success = document.getElementById('formSuccess');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = form.querySelector('#name');
    const phone = form.querySelector('#phone');
    let valid = true;

    [name, phone].forEach((f) => {
      f.classList.remove('form__input--error');
      if (!f.value.trim()) { f.classList.add('form__input--error'); valid = false; }
    });

    if (phone.value.replace(/\D/g, '').length < 11) {
      phone.classList.add('form__input--error');
      valid = false;
    }

    if (!valid) return;

    if (success) {
      form.hidden = true;
      success.hidden = false;
    }
  });
}

function initCounters() {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = parseInt(el.dataset.count, 10);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / 2000, 1);
        el.textContent = Math.floor((1 - Math.pow(1 - p, 3)) * target).toLocaleString('ru-RU');
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      observer.unobserve(el);
    }, { threshold: 0.5 });
    observer.observe(el);
  });
}

function initPhoneMask() {
  const input = document.getElementById('phone');
  if (!input) return;

  input.addEventListener('input', (e) => {
    let d = e.target.value.replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    if (d.length && !d.startsWith('7')) d = '7' + d;
    d = d.slice(0, 11);

    let f = '';
    if (d.length) f = '+7';
    if (d.length > 1) f += ' (' + d.slice(1, 4);
    if (d.length > 4) f += ') ' + d.slice(4, 7);
    if (d.length > 7) f += '-' + d.slice(7, 9);
    if (d.length > 9) f += '-' + d.slice(9, 11);
    e.target.value = f;
  });
}
