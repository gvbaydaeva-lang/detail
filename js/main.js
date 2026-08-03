document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initServicesDropdown();
  initMobileNav();
  initScrollReveal();
  initAdvantageStagger();
  initLightbox();
  initForms();
  initWorksFilters();
  initCounters();
  initPhoneMask();
  initServiceHeroScrim();
});

function initHeader() {
  const header = document.getElementById('header');
  const topbar = document.querySelector('.topbar');
  if (!header) return;
  const mq = window.matchMedia('(max-width: 768px)');
  const onScroll = () => {
    const scrolled = window.scrollY > 20;
    if (mq.matches && topbar) {
      topbar.classList.toggle('topbar--scrolled', scrolled);
      header.classList.remove('header--scrolled');
    } else {
      header.classList.toggle('header--scrolled', scrolled);
      topbar?.classList.remove('topbar--scrolled');
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  mq.addEventListener('change', onScroll);
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
  const burgers = document.querySelectorAll('.burger');
  const nav = document.getElementById('nav');
  if (!burgers.length || !nav) return;

  const setNavOpen = (open) => {
    burgers.forEach((burger) => burger.classList.toggle('burger--active', open));
    nav.classList.toggle('nav--open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  };

  const closeNav = () => {
    setNavOpen(false);
    const dropdown = document.getElementById('navServices');
    if (dropdown) {
      dropdown.classList.remove('nav__dropdown--open');
      dropdown.querySelector('.nav__dropdown-panel')?.setAttribute('hidden', '');
      dropdown.querySelector('.nav__dropdown-trigger')?.setAttribute('aria-expanded', 'false');
    }
  };

  burgers.forEach((burger) => {
    burger.addEventListener('click', () => {
      setNavOpen(!nav.classList.contains('nav--open'));
    });
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
  const photoItems = document.querySelectorAll('[data-lightbox]');
  const videoItems = document.querySelectorAll('[data-lightbox-type="video"]');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const closeBtn = document.getElementById('lightboxClose');
  const prevBtn = document.getElementById('lightboxPrev');
  const nextBtn = document.getElementById('lightboxNext');

  if (!lightbox || (!photoItems.length && !videoItems.length)) return;

  let current = 0;
  let isVideoMode = false;
  let lightboxVideo = document.getElementById('lightboxVideo');

  const images = Array.from(photoItems).map((el) => ({
    src: el.dataset.lightbox || el.querySelector('img')?.src,
    alt: el.querySelector('img')?.alt || '',
  }));

  const clearVideo = () => {
    if (lightboxVideo) {
      lightboxVideo.pause();
      lightboxVideo.removeAttribute('src');
      lightboxVideo.load();
    }
  };

  const showPhotoUI = () => {
    isVideoMode = false;
    lightboxImg.style.display = '';
    prevBtn.style.display = '';
    nextBtn.style.display = '';
    if (lightboxVideo) lightboxVideo.style.display = 'none';
    clearVideo();
  };

  const showVideo = (src) => {
    isVideoMode = true;
    lightboxImg.style.display = 'none';
    prevBtn.style.display = 'none';
    nextBtn.style.display = 'none';

    if (!lightboxVideo) {
      lightboxVideo = document.createElement('video');
      lightboxVideo.id = 'lightboxVideo';
      lightboxVideo.controls = true;
      lightboxVideo.autoplay = true;
      lightboxVideo.style.cssText = 'max-height:90vh; max-width:90vw; border-radius:8px';
      lightbox.insertBefore(lightboxVideo, nextBtn);
    }

    lightboxVideo.style.display = '';
    lightboxVideo.src = src;
    lightboxVideo.play().catch(() => {});
  };

  const openPhoto = (i) => {
    showPhotoUI();
    current = i;
    lightboxImg.src = images[current].src.replace(/w=\d+/, 'w=1400');
    lightboxImg.alt = images[current].alt;
    lightbox.classList.add('lightbox--active');
    document.body.style.overflow = 'hidden';
  };

  const openVideo = (src) => {
    showVideo(src);
    lightbox.classList.add('lightbox--active');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    if (isVideoMode) clearVideo();
    lightbox.classList.remove('lightbox--active');
    document.body.style.overflow = '';
  };

  photoItems.forEach((item, i) => item.addEventListener('click', () => openPhoto(i)));
  videoItems.forEach((item) => {
    item.addEventListener('click', () => openVideo(item.dataset.lightboxSrc));
  });
  closeBtn?.addEventListener('click', close);
  prevBtn?.addEventListener('click', () => { current = (current - 1 + images.length) % images.length; openPhoto(current); });
  nextBtn?.addEventListener('click', () => { current = (current + 1) % images.length; openPhoto(current); });
  lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('lightbox--active')) return;
    if (e.key === 'Escape') close();
    if (!isVideoMode && e.key === 'ArrowLeft') prevBtn?.click();
    if (!isVideoMode && e.key === 'ArrowRight') nextBtn?.click();
  });
}

function initForms() {
  const forms = document.querySelectorAll('.lead-form, #consultForm');
  if (!forms.length) return;

  const params = new URLSearchParams(window.location.search);
  const trackingFields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  trackingFields.forEach((key) => {
    const value = params.get(key);
    if (value) sessionStorage.setItem(`ls_${key}`, value);
  });

  const endpoint =
    document.querySelector('meta[name="ls-form-endpoint"]')?.content?.trim() ||
    window.LS_FORM_ENDPOINT ||
    '';

  forms.forEach((form) => {
    const status = form.querySelector('[data-form-status]') || createFormStatus(form);
    const submit = form.querySelector('[type="submit"]');
    const serviceField = form.querySelector('[name="service"]');

    if (serviceField) {
      const requestedService = params.get('service');
      const requestedServiceLink = requestedService
        ? Array.from(document.querySelectorAll('a[href*="services/"]')).find((link) => {
            const filename = link.getAttribute('href')?.split('/').pop();
            return filename === `${requestedService}.html`;
          })
        : null;
      serviceField.value =
        requestedServiceLink?.textContent?.trim() ||
        requestedService ||
        serviceField.value ||
        document.querySelector('h1')?.textContent?.trim() ||
        '';
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      clearFormErrors(form);

      const payload = collectLeadPayload(form, trackingFields);
      const invalid = validateLeadForm(form, payload);
      if (invalid) {
        const message = invalid.name === 'privacy_consent'
          ? 'Подтвердите согласие на обработку персональных данных.'
          : 'Проверьте выделенные поля.';
        setFormStatus(status, message, 'error');
        invalid.focus();
        return;
      }

      if (payload.website) return;

      if (!endpoint) {
        const whatsappUrl = buildWhatsAppLeadUrl(payload);
        setFormStatus(
          status,
          `Онлайн-отправка подключается. <a href="${whatsappUrl}" target="_blank" rel="noopener">Отправьте эту заявку в WhatsApp</a>.`,
          'warning'
        );
        return;
      }

      submit?.setAttribute('disabled', '');
      if (submit) submit.textContent = 'Отправляем…';
      setFormStatus(status, 'Отправляем заявку…', 'pending');

      try {
        await sendLeadWithRetry(endpoint, payload);
        form.reset();
        if (serviceField) serviceField.value = payload.service;
        setFormStatus(status, 'Спасибо! Заявка отправлена. Мы свяжемся с вами в рабочее время.', 'success');
      } catch (error) {
        const whatsappUrl = buildWhatsAppLeadUrl(payload);
        setFormStatus(
          status,
          `Не удалось отправить автоматически. <a href="${whatsappUrl}" target="_blank" rel="noopener">Отправить заявку в WhatsApp</a>.`,
          'error'
        );
      } finally {
        submit?.removeAttribute('disabled');
        if (submit) submit.textContent = submit.dataset.label || 'Отправить заявку';
      }
    });

    if (submit && !submit.dataset.label) submit.dataset.label = submit.textContent.trim();
  });
}

function createFormStatus(form) {
  const status = document.createElement('div');
  status.className = 'form-status';
  status.dataset.formStatus = '';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  form.appendChild(status);
  return status;
}

function collectLeadPayload(form, trackingFields) {
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());
  payload.page_url = window.location.href;
  payload.page_title = document.title;
  payload.referrer = document.referrer || '';
  payload.submitted_at = new Date().toISOString();
  trackingFields.forEach((key) => {
    payload[key] = payload[key] || sessionStorage.getItem(`ls_${key}`) || '';
  });
  return payload;
}

function clearFormErrors(form) {
  form.querySelectorAll('.form__input--error').forEach((field) => {
    field.classList.remove('form__input--error');
    field.removeAttribute('aria-invalid');
  });
}

function validateLeadForm(form, payload) {
  const required = Array.from(form.querySelectorAll('[required]'));
  let firstInvalid = null;

  required.forEach((field) => {
    const value = field.type === 'checkbox'
      ? (field.checked ? field.value || 'accepted' : '')
      : String(payload[field.name] || '').trim();
    const phoneInvalid = field.type === 'tel' && value.replace(/\D/g, '').length < 11;
    const checkboxInvalid = field.type === 'checkbox' && !field.checked;
    if (!value || phoneInvalid || checkboxInvalid) {
      field.classList.add('form__input--error');
      field.setAttribute('aria-invalid', 'true');
      if (!firstInvalid) firstInvalid = field;
    }
  });

  return firstInvalid;
}

async function sendLeadWithRetry(endpoint, payload) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Lead endpoint returned ${response.status}`);
      return;
    } catch (error) {
      lastError = error;
    } finally {
      window.clearTimeout(timer);
    }
  }
  throw lastError;
}

function buildWhatsAppLeadUrl(payload) {
  const lines = [
    'Здравствуйте! Хочу оставить заявку в LS Detailing.',
    payload.request_type ? `Тип: ${payload.request_type}` : '',
    payload.service ? `Услуга: ${payload.service}` : '',
    payload.name ? `Имя: ${payload.name}` : '',
    payload.phone ? `Телефон: ${payload.phone}` : '',
    payload.comment ? `Комментарий: ${payload.comment}` : '',
    `Страница: ${payload.page_url}`,
    payload.utm_campaign ? `Кампания: ${payload.utm_campaign}` : '',
  ].filter(Boolean);
  return `https://wa.me/79618422227?text=${encodeURIComponent(lines.join('\n'))}`;
}

function setFormStatus(status, message, type) {
  status.className = `form-status form-status--${type}`;
  status.innerHTML = message;
}

function initWorksFilters() {
  const filters = document.querySelector('[data-work-filters]');
  const gallery = document.getElementById('gallery');
  if (!filters || !gallery) return;

  const cards = Array.from(gallery.querySelectorAll('[data-work-category]'));
  const selected = { category: 'all', brand: 'all' };
  filters.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-filter]');
    if (!button) return;
    const kind = button.dataset.filterKind;
    const value = button.dataset.filter;
    selected[kind] = value;

    filters.querySelectorAll(`button[data-filter-kind="${kind}"]`).forEach((item) => {
      const active = item === button;
      item.classList.toggle('work-filter--active', active);
      item.setAttribute('aria-pressed', String(active));
    });

    cards.forEach((card) => {
      const categories = (card.dataset.workCategory || '').split(' ');
      const brands = (card.dataset.workBrand || '').split(' ');
      const categoryMatch = selected.category === 'all' || categories.includes(selected.category);
      const brandMatch = selected.brand === 'all' || brands.includes(selected.brand);
      card.hidden = !(categoryMatch && brandMatch);
    });
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
  const inputs = document.querySelectorAll('input[type="tel"]');
  inputs.forEach((input) => {
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
