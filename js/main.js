document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initServicesDropdown();
  initMobileNav();
  initScrollReveal();
  initAdvantageStagger();
  initLightbox();
  initForm();
  initCounters();
  initPhoneMask();
  initServiceHeroScrim();
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

function initAdvantageStagger() {
  const grids = document.querySelectorAll('[data-advantage-stagger]');
  if (!grids.length) return;

  const isMobile = window.matchMedia('(max-width: 768px)').matches;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('advantages__cluster-grid--visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: isMobile ? 0.08 : 0.15,
      rootMargin: isMobile ? '0px 0px -5% 0px' : '0px 0px -24px 0px',
    }
  );

  grids.forEach((grid) => observer.observe(grid));
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
    const duration = parseInt(el.dataset.duration, 10) || 2000;
    const plain = el.hasAttribute('data-plain');
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1);
        const val = Math.floor((1 - Math.pow(1 - p, 3)) * target);
        el.textContent = plain ? String(val) : val.toLocaleString('ru-RU');
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

function initServiceHeroScrim() {
  const blocks = document.querySelectorAll('.service-hero__content');
  if (!blocks.length) return;

  const buildMask = (scrimW, scrimH) => {
    const aspect = scrimW / scrimH;
    const stop1 = 18;
    const stop2 = 85;
    const maxAxis = (50 / stop2) * 100 * 0.96;

    let rx = 50;
    let ry = 50;

    if (aspect > 1.05) {
      rx = Math.min(maxAxis, 46 + (aspect - 1) * 20);
      ry = Math.max(38, 50 - (aspect - 1) * 14);
    } else if (aspect < 0.95) {
      ry = Math.min(maxAxis, 46 + (1 / aspect - 1) * 20);
      rx = Math.max(38, 50 - (1 / aspect - 1) * 14);
    }

    const ellipse = `ellipse ${rx.toFixed(1)}% ${ry.toFixed(1)}% at 50% 50%`;

    return {
      mask: `radial-gradient(${ellipse}, black 0%, black ${stop1}%, transparent ${stop2}%)`,
      background: `radial-gradient(${ellipse}, rgba(0, 0, 0, 0.62) 0%, rgba(0, 0, 0, 0.62) ${stop1}%, rgba(0, 0, 0, 0) ${stop2}%)`,
    };
  };

  const layoutScrim = (content) => {
    const scrim = content.querySelector('.service-hero__scrim');
    if (!scrim) return;

    scrim.style.width = '';
    scrim.style.height = '';
    scrim.style.left = '';
    scrim.style.bottom = '';
    scrim.style.background = '';
    scrim.style.webkitMaskImage = '';
    scrim.style.maskImage = '';

    const width = content.offsetWidth;
    const height = content.offsetHeight;
    if (!width || !height) return;

    const pad = Math.round(Math.max(80, Math.min(160, Math.max(width, height) * 0.24)));
    const scrimW = width + pad * 2;
    const scrimH = height + pad * 2;

    scrim.style.left = `${-pad}px`;
    scrim.style.bottom = `${-pad}px`;
    scrim.style.width = `${scrimW}px`;
    scrim.style.height = `${scrimH}px`;

    const { mask, background } = buildMask(scrimW, scrimH);
    scrim.style.webkitMaskImage = mask;
    scrim.style.maskImage = mask;
    scrim.style.background = background;
  };

  const relayoutAll = () => {
    blocks.forEach(layoutScrim);
  };

  relayoutAll();

  let raf = null;
  window.addEventListener('resize', () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(relayoutAll);
  }, { passive: true });

  if (document.fonts?.ready) {
    document.fonts.ready.then(relayoutAll);
  }

  if (typeof ResizeObserver !== 'undefined') {
    blocks.forEach((content) => {
      const observer = new ResizeObserver(relayoutAll);
      observer.observe(content);
      content.querySelectorAll('.service-hero__title, .service-hero__intro').forEach((el) => {
        observer.observe(el);
      });
    });
  }
}
