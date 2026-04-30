/* ================================================================
   TEAVAULT — Main Application Script
   ================================================================ */

'use strict';

/* ── Reveal on Scroll ── */
const initReveal = () => {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); } }),
    { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
  );
  els.forEach(el => observer.observe(el));
};

/* ── Nav Scroll Behaviour ── */
const initNav = () => {
  const nav = document.getElementById('main-nav');
  if (!nav) return;
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 50);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile-menu');
  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
      const spans = hamburger.querySelectorAll('span');
      const isOpen = mobileMenu.classList.contains('open');
      if (isOpen) {
        spans[0].style.cssText = 'transform:rotate(45deg) translate(5px,6px)';
        spans[1].style.cssText = 'opacity:0';
        spans[2].style.cssText = 'transform:rotate(-45deg) translate(5px,-6px)';
      } else {
        spans.forEach(s => s.style.cssText = '');
      }
    });
  }
};

/* ── Parallax Hero ── */
const initParallax = () => {
  const layer1 = document.getElementById('parallax-1');
  const layer2 = document.getElementById('parallax-2');
  if (!layer1) return;
  const onScroll = () => {
    const s = window.scrollY;
    layer1.style.transform = `translateY(${s * 0.3}px)`;
    if (layer2) layer2.style.transform = `translateY(${s * 0.2}px)`;
  };
  window.addEventListener('scroll', onScroll, { passive: true });
};

/* ── Newsletter ── */
const handleNewsletter = (e) => {
  e.preventDefault();
  const form = document.getElementById('newsletter-form');
  const success = document.getElementById('newsletter-success');
  if (form && success) {
    form.style.display = 'none';
    success.style.display = 'block';
  }
};
window.handleNewsletter = handleNewsletter;

/* ── SVG Origin Map ── */
const initMap = () => {
  const tooltip = document.getElementById('map-tooltip');
  const pins = document.querySelectorAll('.map-pin-group');
  if (!pins.length) return;
  const counts = {
    'Japan': '38 teas', 'China': '94 teas', 'Taiwan': '22 teas',
    'India': '56 teas', 'Sri Lanka': '18 teas', 'Kenya': '12 teas',
    'Nepal': '9 teas', 'Morocco': '7 teas', 'Turkey': '6 teas'
  };
  pins.forEach(pin => {
    pin.style.cursor = 'pointer';
    pin.addEventListener('mouseenter', (e) => {
      const origin = pin.dataset.origin;
      if (!tooltip) return;
      tooltip.querySelector('.map-tooltip-origin').textContent = origin;
      tooltip.querySelector('.map-tooltip-count').textContent = counts[origin] || '';
      tooltip.classList.add('visible');
    });
    pin.addEventListener('mousemove', (e) => {
      const rect = e.currentTarget.closest('svg').getBoundingClientRect();
      tooltip.style.left = (e.clientX - rect.left + 12) + 'px';
      tooltip.style.top  = (e.clientY - rect.top  - 36) + 'px';
    });
    pin.addEventListener('mouseleave', () => tooltip.classList.remove('visible'));
    pin.addEventListener('click', () => {
      const origin = pin.dataset.origin.toLowerCase().replace(' ', '-');
      window.location.href = `catalog.html?origin=${origin}`;
    });
  });
};

/* ================================================================
   CATALOG PAGE
   ================================================================ */

/* Tea data */
const TEA_DATA = [
  { id: 1, name: 'Uji Gyokuro', origin: '🇯🇵 Japan', region: 'japan', type: 'green', grade: 'Ceremonial', harvest: 'Spring 2025', price: '$38 / 50g', wholesale: '$18 / 100g', moq: '500g', tags: ['Focus', 'L-theanine', 'Antioxidant'], notes: ['🌊 Oceanic', '🌿 Umami', '🍬 Sweet'], card: 'tcard-green', certifications: ['Organic', 'JAS'] },
  { id: 2, name: 'Phoenix Dancong', origin: '🇨🇳 China', region: 'china', type: 'oolong', grade: 'Single-Tree', harvest: 'Autumn 2024', price: '$52 / 50g', wholesale: '$24 / 100g', moq: '250g', tags: ['Digestion', 'Antioxidant'], notes: ['🌺 Orchid', '🍯 Honey', '🔥 Spice'], card: 'tcard-oolong', certifications: [] },
  { id: 3, name: 'Darjeeling First Flush', origin: '🇮🇳 India', region: 'india', type: 'black', grade: 'SFTGFOP1', harvest: 'March 2025', price: '$44 / 50g', wholesale: '$20 / 100g', moq: '500g', tags: ['Energy', 'Antioxidant'], notes: ['🍇 Muscatel', '🌸 Floral', '✨ Brisk'], card: 'tcard-black', certifications: ['Organic', 'Rainforest Alliance'] },
  { id: 4, name: 'Silver Needle Bai Hao', origin: '🇨🇳 China', region: 'china', type: 'white', grade: 'Imperial', harvest: 'Spring 2025', price: '$68 / 50g', wholesale: '$32 / 100g', moq: '250g', tags: ['Sleep', 'Antioxidant', 'Calm'], notes: ['🌸 Floral', '🍈 Melon', '☁️ Gentle'], card: 'tcard-white', certifications: ['Organic'] },
  { id: 5, name: 'Menghai Pu-erh Cake', origin: '🇨🇳 China', region: 'china', type: 'puerh', grade: '2010 Vintage', harvest: 'Aged 15yr', price: '$88 / 357g', wholesale: '$38 / 357g', moq: '1 cake', tags: ['Digestion', 'Probiotic', 'Energy'], notes: ['🍄 Earthy', '🍂 Forest', '🍮 Sweet depth'], card: 'tcard-puerh', certifications: [] },
  { id: 6, name: 'Ali Shan High Mountain', origin: '🇹🇼 Taiwan', region: 'taiwan', type: 'oolong', grade: 'GABA', harvest: 'Winter 2024', price: '$56 / 50g', wholesale: '$26 / 100g', moq: '500g', tags: ['GABA', 'Calm', 'Focus'], notes: ['🧈 Butter', '🌾 Cream', '🌺 Floral'], card: 'tcard-oolong', certifications: ['Organic'] },
  { id: 7, name: 'Moroccan Mint Atay', origin: '🇲🇦 Morocco', region: 'morocco', type: 'herbal', grade: 'Traditional Blend', harvest: 'Summer 2025', price: '$22 / 100g', wholesale: '$9 / 200g', moq: '1kg', tags: ['Digestion', 'Mood', 'Refreshing'], notes: ['🌿 Mint', '🌺 Sweet', '✨ Bright'], card: 'tcard-herbal', certifications: ['Fair Trade'] },
  { id: 8, name: 'Nepali Jun Chiyabari', origin: '🇳🇵 Nepal', region: 'nepal', type: 'oolong', grade: 'Himalayan Oolong', harvest: 'Spring 2025', price: '$48 / 50g', wholesale: '$22 / 100g', moq: '500g', tags: ['Antioxidant', 'Focus'], notes: ['🍑 Apricot', '🌸 Rose', '🤎 Muscatel'], card: 'tcard-oolong', certifications: ['Organic', 'Fair Trade'] },
  { id: 9, name: 'Kenya Milima Black', origin: '🇰🇪 Kenya', region: 'kenya', type: 'black', grade: 'Whole Leaf', harvest: 'June 2025', price: '$28 / 100g', wholesale: '$12 / 250g', moq: '1kg', tags: ['Energy', 'Antioxidant'], notes: ['🫐 Berry', '☕ Bold', '🌿 Earthy'], card: 'tcard-black', certifications: ['Rainforest Alliance', 'Fair Trade'] },
  { id: 10, name: 'Gyokuro Kabuse', origin: '🇯🇵 Japan', region: 'japan', type: 'green', grade: 'Third-flush', harvest: 'Autumn 2024', price: '$42 / 50g', wholesale: '$19 / 100g', moq: '500g', tags: ['L-theanine', 'Focus', 'Calm'], notes: ['🌊 Marine', '🌿 Vegetal', '🍬 Lingering'], card: 'tcard-green', certifications: ['JAS Organic'] },
  { id: 11, name: 'Ceylon Orange Pekoe', origin: '🇱🇰 Sri Lanka', region: 'sri-lanka', type: 'black', grade: 'OP1', harvest: 'August 2025', price: '$24 / 100g', wholesale: '$10 / 250g', moq: '1kg', tags: ['Energy', 'Classic'], notes: ['🯂 Bright', '🍋 Citrus', '⚡ Brisk'], card: 'tcard-black', certifications: [] },
  { id: 12, name: 'Huang Shan Mao Feng', origin: '🇨🇳 China', region: 'china', type: 'green', grade: 'Premium', harvest: 'Spring 2025', price: '$36 / 50g', wholesale: '$16 / 100g', moq: '500g', tags: ['Antioxidant', 'Refreshing'], notes: ['🌸 Orchid', '🍃 Fresh grass', '🧪 Crisp'], card: 'tcard-green', certifications: ['Organic'] },
  { id: 13, name: 'Dong Ding Oolong', origin: '🇹🇼 Taiwan', region: 'taiwan', type: 'oolong', grade: 'Traditional Roasted', harvest: 'Winter 2024', price: '$46 / 50g', wholesale: '$21 / 100g', moq: '500g', tags: ['Digestion', 'Warming'], notes: ['🍯 Caramel', '🌰 Toasty', '🌺 Floral'], card: 'tcard-oolong', certifications: [] },
  { id: 14, name: 'Moonlight White Tea', origin: '🇨🇳 China', region: 'china', type: 'white', grade: 'Moonlight', harvest: 'Spring 2025', price: '$72 / 50g', wholesale: '$34 / 100g', moq: '250g', tags: ['Calm', 'Sleep', 'Antioxidant'], notes: ['🌙 Honey', '🌹 Rose', '🍈 Sweet'], card: 'tcard-white', certifications: ['Organic'] },
  { id: 15, name: 'Rize Çay Black', origin: '🇹🇷 Turkey', region: 'turkey', type: 'black', grade: 'Traditional', harvest: 'Summer 2025', price: '$18 / 200g', wholesale: '$7 / 500g', moq: '2kg', tags: ['Energy', 'Social', 'Bold'], notes: ['⚡ Strong', '🌿 Grassy', '🤎 Earthy'], card: 'tcard-black', certifications: [] },
  { id: 16, name: 'Huoshan Yellow Sprout', origin: '🇨🇳 China', region: 'china', type: 'yellow', grade: 'Huoshan Huangya', harvest: 'Spring 2025', price: '$78 / 50g', wholesale: '$36 / 100g', moq: '250g', tags: ['Rare', 'Antioxidant', 'Calm'], notes: ['🌾 Mellow', '🍎 Apple', '☁️ Silky'], card: 'tcard-yellow', certifications: ['Organic'] },
];

let activeFilters = { types: [], regions: [], health: [], price: [0, 200] };
let isWholesale = false;

const renderTeaCards = (teas) => {
  const grid = document.getElementById('tea-grid');
  if (!grid) return;
  const countEl = document.getElementById('catalog-count');
  if (countEl) countEl.textContent = `${teas.length} teas`;

  grid.innerHTML = teas.map(t => `
    <article class="tea-card ${t.card} reveal">
      <div class="tea-card-img">
        <div class="tea-card-img-inner"></div>
        <div class="tea-card-actions">
          <button class="card-action-btn" title="Save" onclick="toggleSave(${t.id}, this)">♡</button>
          <button class="card-action-btn" title="Quick view" onclick="quickViewTea(${t.id})">⊕</button>
        </div>
      </div>
      <div class="tea-card-body">
        <div class="tea-card-region">${t.origin} · ${t.grade}</div>
        <h3 class="tea-card-name">${t.name}</h3>
        <p class="tea-card-supplier">${t.harvest}</p>
        <div class="tea-card-tags">${t.tags.map(tag => `<span class="health-tag">${tag}</span>`).join('')}</div>
        <div class="tea-card-notes" style="display:flex;flex-wrap:wrap;gap:.35rem;margin-bottom:.85rem;">
          ${t.notes.map(n => `<span class="note-chip">${n}</span>`).join('')}
        </div>
        <div class="tea-card-footer">
          <div>
            <div class="tea-retail-price">${t.price}</div>
            <div class="tea-wholesale-price">💼 ${t.wholesale} · MOQ: ${t.moq}</div>
          </div>
          <a href="product.html?id=${t.id}" class="tea-card-buy" title="View tea">→</a>
        </div>
      </div>
    </article>
  `).join('');

  // re-run reveal observer
  document.querySelectorAll('.tea-card.reveal').forEach(el => {
    el.classList.add('visible');
  });
};

const filterTeas = () => {
  let result = [...TEA_DATA];
  if (activeFilters.types.length) result = result.filter(t => activeFilters.types.includes(t.type));
  if (activeFilters.regions.length) result = result.filter(t => activeFilters.regions.includes(t.region));
  renderTeaCards(result);
};

window.toggleSave = (id, btn) => {
  btn.textContent = btn.textContent === '♡' ? '♥' : '♡';
  btn.style.color = btn.textContent === '♥' ? 'var(--terra)' : '';
};

window.quickViewTea = (id) => {
  const t = TEA_DATA.find(x => x.id === id);
  if (!t) return;
  // Could open lightbox — simplified to navigate
  window.location.href = `product.html?id=${id}`;
};

const initCatalog = () => {
  if (!document.getElementById('tea-grid')) return;

  // Get URL param filters
  const params = new URLSearchParams(window.location.search);
  const typeParam = params.get('type');
  const originParam = params.get('origin');
  if (typeParam) activeFilters.types = [typeParam];
  if (originParam) activeFilters.regions = [originParam];

  renderTeaCards(TEA_DATA);

  // Filter checkboxes
  document.querySelectorAll('.filter-option input').forEach(cb => {
    cb.addEventListener('change', () => {
      const group = cb.dataset.group;
      const val = cb.value;
      if (!activeFilters[group]) activeFilters[group] = [];
      if (cb.checked) { activeFilters[group].push(val); }
      else { activeFilters[group] = activeFilters[group].filter(v => v !== val); }
      filterTeas();
    });
    // Pre-check based on URL params
    if (cb.dataset.group === 'types' && activeFilters.types.includes(cb.value)) cb.checked = true;
    if (cb.dataset.group === 'regions' && activeFilters.regions.includes(cb.value)) cb.checked = true;
  });

  // Filter group collapse
  document.querySelectorAll('.filter-group-title').forEach(title => {
    title.addEventListener('click', () => title.parentElement.classList.toggle('collapsed'));
  });

  // B2B wholesale toggle
  const toggle = document.getElementById('wholesale-toggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      isWholesale = !isWholesale;
      toggle.classList.toggle('on', isWholesale);
      document.body.classList.toggle('wholesale-mode', isWholesale);
      const info = document.getElementById('b2b-mode-info');
      if (info) info.classList.toggle('visible', isWholesale);
    });
  }

  // Sort
  const sortEl = document.getElementById('catalog-sort');
  if (sortEl) {
    sortEl.addEventListener('change', () => {
      let data = [...TEA_DATA];
      switch (sortEl.value) {
        case 'price-asc': data.sort((a, b) => parseFloat(a.price) - parseFloat(b.price)); break;
        case 'price-desc': data.sort((a, b) => parseFloat(b.price) - parseFloat(a.price)); break;
        case 'featured': break; // default order
      }
      renderTeaCards(data);
    });
  }

  // Clear filters
  const clearBtn = document.querySelector('.filter-clear');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      activeFilters = { types: [], regions: [], health: [] };
      document.querySelectorAll('.filter-option input').forEach(cb => cb.checked = false);
      renderTeaCards(TEA_DATA);
    });
  }
};

/* ================================================================
   SUBSCRIPTION BUILDER
   ================================================================ */
let subState = { tier: 'connoisseur', gift: false, months: 3, step: 1 };

const initSubscriptionBuilder = () => {
  const steps = document.querySelectorAll('.sub-step');
  const contents = document.querySelectorAll('.sub-step-content');
  if (!steps.length) return;

  const goToStep = (n) => {
    subState.step = n;
    steps.forEach((s, i) => s.classList.toggle('active', i + 1 === n));
    contents.forEach((c, i) => c.classList.toggle('active', i + 1 === n));
    updateSummary();
  };

  steps.forEach((s, i) => s.addEventListener('click', () => { if (i + 1 <= subState.step || i + 1 <= 2) goToStep(i + 1); }));

  document.querySelectorAll('.sub-next-btn').forEach(btn => {
    btn.addEventListener('click', () => { if (subState.step < 3) goToStep(subState.step + 1); });
  });
  document.querySelectorAll('.sub-back-btn').forEach(btn => {
    btn.addEventListener('click', () => { if (subState.step > 1) goToStep(subState.step - 1); });
  });

  // Tier selection
  document.querySelectorAll('.tier-option').forEach(card => {
    card.addEventListener('click', () => {
      document.querySelectorAll('.tier-option').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      subState.tier = card.dataset.tier;
      updateSummary();
    });
  });

  // Gift toggle
  const giftToggle = document.getElementById('gift-toggle');
  const giftForm = document.getElementById('gift-form');
  if (giftToggle) {
    giftToggle.addEventListener('click', () => {
      subState.gift = !subState.gift;
      giftToggle.classList.toggle('on', subState.gift);
      if (giftForm) giftForm.classList.toggle('visible', subState.gift);
    });
  }

  goToStep(1);
};

const tierPrices = { wanderer: 28, connoisseur: 58, reserve: 128 };
const tierNames = { wanderer: 'Wanderer', connoisseur: 'Connoisseur', reserve: 'Reserve' };

const updateSummary = () => {
  const summ = document.getElementById('sub-summary-tier');
  const summPrice = document.getElementById('sub-summary-price');
  if (summ) summ.textContent = tierNames[subState.tier] || '—';
  if (summPrice) {
    const price = tierPrices[subState.tier] || 0;
    summPrice.textContent = subState.tier === 'reserve' ? `$${price}/quarter` : `$${price}/month`;
  }
};

/* ================================================================
   EDUCATION HUB
   ================================================================ */
const initEducation = () => {
  // Filter edu nav highlight on scroll
  const sections = document.querySelectorAll('.edu-section');
  const navLinks = document.querySelectorAll('.edu-nav-links a');
  if (!sections.length) return;

  const highlight = () => {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 200) current = s.id;
    });
    navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + current));
  };
  window.addEventListener('scroll', highlight, { passive: true });

  // Medicinal tag filter
  document.querySelectorAll('.med-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      tag.classList.toggle('active');
      const activeBenefits = [...document.querySelectorAll('.med-tag.active')].map(t => t.dataset.benefit);
      // Filter edu cards if present
      document.querySelectorAll('.edu-card').forEach(card => {
        const cardBenefits = (card.dataset.benefits || '').split(',');
        if (!activeBenefits.length || activeBenefits.some(b => cardBenefits.includes(b))) {
          card.style.display = '';
        } else { card.style.display = 'none'; }
      });
    });
  });

  // Brew sliders
  const tempSlider = document.getElementById('brew-temp');
  const tempVal = document.getElementById('brew-temp-val');
  const ratioSlider = document.getElementById('brew-ratio');
  const ratioVal = document.getElementById('brew-ratio-val');
  const timeSlider = document.getElementById('brew-time');
  const timeVal = document.getElementById('brew-time-val');

  if (tempSlider) tempSlider.addEventListener('input', () => { tempVal.textContent = tempSlider.value + '°C'; });
  if (ratioSlider) ratioSlider.addEventListener('input', () => { ratioVal.textContent = ratioSlider.value + 'g / 150ml'; });
  if (timeSlider) timeSlider.addEventListener('input', () => { timeVal.textContent = timeSlider.value + 's'; });
};

/* ================================================================
   GALLERY + LIGHTBOX
   ================================================================ */
const initGallery = () => {
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lightbox-placeholder');
  const lbCap = document.getElementById('lightbox-caption');
  const lbClose = document.getElementById('lightbox-close');

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => {
      if (!lb) return;
      const cap = item.dataset.caption || '';
      if (lbCap) lbCap.textContent = cap;
      const bg = item.querySelector('.gallery-item-placeholder')?.style.background || '';
      if (lbImg) lbImg.style.background = bg;
      lb.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });
  if (lbClose) lbClose.addEventListener('click', closeLightbox);
  if (lb) lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });

  // Keyboard
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

  // Gallery filters
  document.querySelectorAll('.gallery-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.gallery-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.gallery-item').forEach(item => {
        if (filter === 'all' || (item.dataset.tags || '').includes(filter)) item.style.display = '';
        else item.style.display = 'none';
      });
    });
  });
};

const closeLightbox = () => {
  const lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
  document.body.style.overflow = '';
};

/* ================================================================
   EVENTS CALENDAR
   ================================================================ */
const EVENTS = [
  { id: 1, title: 'World Tea Expo', location: 'Las Vegas, USA', date: 'May 20', month: 'May', type: 'Festival', desc: 'The world\'s largest trade event dedicated to the tea industry — suppliers, buyers, educators and enthusiasts.', country: 'USA' },
  { id: 2, title: 'Uji Tea Ceremony Week', location: 'Kyoto, Japan', date: 'Jun 5', month: 'Jun', type: 'Ceremony', desc: 'A week of traditional tea ceremony demonstrations, tastings, and cultural exchange in the birthplace of Japanese tea.', country: 'Japan' },
  { id: 3, title: 'Darjeeling Tea Festival', location: 'Darjeeling, India', date: 'Jun 12', month: 'Jun', type: 'Festival', desc: 'Annual festival celebrating the world-famous first flush season with garden tours, auctions, and cultural events.', country: 'India' },
  { id: 4, title: 'TeaVault Virtual Tasting', location: 'Online, Global', date: 'Jun 18', month: 'Jun', type: 'Virtual', desc: 'Join our lead tea sommelier for a live guided tasting of five reserve-tier teas — shipped directly to your door.', country: 'Virtual' },
  { id: 5, title: 'Taiwan International Tea Expo', location: 'Taipei, Taiwan', date: 'Jul 8', month: 'Jul', type: 'Exhibition', desc: 'Taiwan\'s premier tea trade and culture expo featuring high mountain oolongs, gaba teas, and artisan producers.', country: 'Taiwan' },
  { id: 6, title: 'London Tea Festival', location: 'London, UK', date: 'Jul 22', month: 'Jul', type: 'Festival', desc: 'Celebrating tea culture from around the world — tastings, expert talks, vintage teaware, and afternoon tea experiences.', country: 'UK' },
  { id: 7, title: 'Chaozhou Gongfu Competition', location: 'Chaozhou, China', date: 'Aug 10', month: 'Aug', type: 'Competition', desc: 'The most prestigious gongfu cha competition in China, featuring masters from across Guangdong province.', country: 'China' },
  { id: 8, title: 'TeaVault B2B Sourcing Forum', location: 'New York, USA', date: 'Sep 4', month: 'Sep', type: 'B2B', desc: 'Exclusive to verified B2B members — meet 30+ vetted suppliers, attend sourcing workshops, and build your 2026 supply chain.', country: 'USA' },
];

const eventColors = { Festival: '#5C7A4E', Ceremony: '#B8933F', Virtual: '#8B4513', Exhibition: '#1C1208', Competition: '#7A3A20', B2B: '#1C3360' };

const initEvents = () => {
  const grid = document.getElementById('events-grid');
  if (!grid) return;

  const render = (data) => {
    grid.innerHTML = data.map(ev => `
      <article class="event-card">
        <div class="event-card-header" style="background:${eventColors[ev.type] || '#1C1208'}">
          <div class="event-card-month">${ev.month}</div>
          <div class="event-card-date">${ev.date.split(' ')[1]}</div>
          <div class="event-card-type-badge">${ev.type}</div>
        </div>
        <div class="event-card-body">
          <h3 class="event-title">${ev.title}</h3>
          <p class="event-location">📍 ${ev.location}</p>
          <p class="event-desc">${ev.desc}</p>
          <div class="event-card-footer">
            <a href="#" class="btn btn-outline-dark btn-sm btn-rsvp" onclick="rsvpEvent(${ev.id}, this); return false;">RSVP / Info</a>
            <a href="#" class="btn btn-sm" style="color:var(--warm-grey);border:none;text-decoration:underline;" onclick="addToCal(${ev.id}); return false;">Add to Calendar</a>
          </div>
        </div>
      </article>
    `).join('');
  };

  render(EVENTS);

  // Region filter
  document.querySelectorAll('.events-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.events-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      render(f === 'all' ? EVENTS : EVENTS.filter(e => e.country === f || e.type === f));
    });
  });
};

window.rsvpEvent = (id, btn) => {
  btn.textContent = '✓ RSVP\'d';
  btn.style.background = 'var(--sage)';
  btn.style.color = 'white';
  btn.style.borderColor = 'var(--sage)';
};
window.addToCal = (id) => { alert('Calendar invite would download here (ICS file).'); };

/* ================================================================
   B2B RFQ BUILDER
   ================================================================ */
let rfqItems = [];

const initRFQ = () => {
  const rfqForm = document.getElementById('rfq-form');
  if (!rfqForm) return;

  const addBtn = document.getElementById('rfq-add-tea');
  const rfqList = document.getElementById('rfq-tea-list');

  if (addBtn) addBtn.addEventListener('click', () => {
    const teaSelect = document.getElementById('rfq-tea-select');
    const qtyInput = document.getElementById('rfq-qty');
    if (!teaSelect || !qtyInput) return;
    const tea = TEA_DATA.find(t => t.id === parseInt(teaSelect.value));
    if (!tea) return;
    rfqItems.push({ tea, qty: qtyInput.value || '1kg' });
    renderRFQList();
  });

  const renderRFQList = () => {
    if (!rfqList) return;
    rfqList.innerHTML = rfqItems.map((item, i) => `
      <div class="rfq-tea-row">
        <div class="rfq-tea-name">${item.tea.name} <span style="color:var(--warm-grey);font-size:.75rem;">(${item.tea.origin})</span></div>
        <div class="rfq-tea-qty">${item.qty}</div>
        <button class="rfq-remove" onclick="removeRFQItem(${i})" title="Remove">×</button>
      </div>
    `).join('') || '<p style="color:var(--warm-grey);font-size:.85rem;padding:.5rem 0;">No teas added yet.</p>';
  };
  renderRFQList();
};

window.removeRFQItem = (i) => {
  rfqItems.splice(i, 1);
  const list = document.getElementById('rfq-tea-list');
  if (list) list.innerHTML = rfqItems.map((item, j) => `
    <div class="rfq-tea-row"><div class="rfq-tea-name">${item.tea.name}</div><div>${item.qty}</div><button class="rfq-remove" onclick="removeRFQItem(${j})">×</button></div>
  `).join('') || '<p style="color:var(--warm-grey);font-size:.85rem;padding:.5rem 0;">No teas added yet.</p>';
};

/* ================================================================
   TASTE QUIZ
   ================================================================ */
const QUIZ = [
  { q: 'What flavour profile excites you most?', opts: [{ icon: '🌿', label: 'Fresh & grassy', val: 'green' }, { icon: '🌺', label: 'Floral & aromatic', val: 'oolong' }, { icon: '🍯', label: 'Rich & sweet', val: 'black' }, { icon: '🍂', label: 'Deep & earthy', val: 'puerh' }] },
  { q: 'How do you like your tea\'s body?', opts: [{ icon: '☁️', label: 'Light & delicate', val: 'white' }, { icon: '🌊', label: 'Smooth & silky', val: 'green' }, { icon: '⚡', label: 'Bold & full', val: 'black' }, { icon: '🍮', label: 'Rich & complex', val: 'puerh' }] },
  { q: 'What matters most to you?', opts: [{ icon: '🧘', label: 'Calm & focus', val: 'wellness' }, { icon: '🌏', label: 'Origin & story', val: 'provenance' }, { icon: '🔬', label: 'Brewing craft', val: 'craft' }, { icon: '💎', label: 'Rarity & prestige', val: 'rare' }] },
  { q: 'Which occasion fits you best?', opts: [{ icon: '🌅', label: 'Morning ritual', val: 'morning' }, { icon: '🤝', label: 'Social gathering', val: 'social' }, { icon: '📚', label: 'Quiet evening', val: 'evening' }, { icon: '🧭', label: 'Discovery & adventure', val: 'explore' }] },
];

let quizStep = 0;
let quizAnswers = [];

const initQuiz = () => {
  const qEl = document.getElementById('quiz-question');
  const optsEl = document.getElementById('quiz-options');
  const progressEl = document.getElementById('quiz-progress-fill');
  if (!qEl) return;

  const renderQuiz = () => {
    const q = QUIZ[quizStep];
    if (!q) { showQuizResult(); return; }
    qEl.textContent = q.q;
    optsEl.innerHTML = q.opts.map(opt => `
      <div class="quiz-option" onclick="selectQuizOpt('${opt.val}', this)">
        <div class="quiz-option-icon">${opt.icon}</div>
        <div class="quiz-option-label">${opt.label}</div>
      </div>
    `).join('');
    if (progressEl) progressEl.style.width = ((quizStep / QUIZ.length) * 100) + '%';
  };
  renderQuiz();

  window.selectQuizOpt = (val, el) => {
    el.parentElement.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    quizAnswers[quizStep] = val;
    setTimeout(() => { quizStep++; renderQuiz(); }, 380);
  };

  const showQuizResult = () => {
    const container = document.querySelector('.quiz-container');
    if (!container) return;
    container.innerHTML = `
      <div style="text-align:center;padding:3rem 0;">
        <div style="font-size:3rem;margin-bottom:1.5rem;">🍵</div>
        <h2 style="font-family:var(--font-display);font-size:2.5rem;font-weight:600;color:var(--umber);margin-bottom:0.75rem;">Your Profile: The Curious Explorer</h2>
        <p style="color:rgba(28,18,8,0.65);margin-bottom:2rem;font-size:.95rem;line-height:1.75;">Based on your preferences, you'll love complex, aromatic teas with great origin stories — oolongs and high-mountain greens are your territory.</p>
        <div style="display:flex;gap:1rem;justify-content:center;flex-wrap:wrap;">
          <a href="catalog.html?type=oolong" class="btn btn-primary">Explore My Teas</a>
          <a href="subscriptions.html" class="btn btn-outline-dark">Start a Subscription</a>
        </div>
      </div>
    `;
  };
};

/* ================================================================
   PROFILE DASHBOARD
   ================================================================ */
const initProfile = () => {
  const tabs = document.querySelectorAll('.profile-tab-btn');
  const contents = document.querySelectorAll('.profile-tab-content');
  if (!tabs.length) return;
  tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.forEach(b => b.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const t = document.getElementById('profile-' + btn.dataset.tab);
      if (t) t.classList.add('active');
    });
  });
};

/* ================================================================
   SMOOTH SCROLL + ANCHOR DETECTION
   ================================================================ */
const handleAnchor = () => {
  if (window.location.hash) {
    const el = document.querySelector(window.location.hash);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 300);
  }
};

/* ================================================================
   UTILITY — Page loader fade
   ================================================================ */
const initPageLoad = () => {
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity 0.5s ease';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => { document.body.style.opacity = '1'; });
  });
};

/* ================================================================
   INIT ALL
   ================================================================ */
document.addEventListener('DOMContentLoaded', () => {
  initPageLoad();
  initNav();
  initReveal();
  initParallax();
  initMap();
  initCatalog();
  initSubscriptionBuilder();
  initEducation();
  initGallery();
  initEvents();
  initRFQ();
  initQuiz();
  initProfile();
  handleAnchor();
});
