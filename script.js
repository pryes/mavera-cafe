/* ============================================
   MÂVERÂ CAFE & RESTORAN
   Supabase Entegrasyonu + Interactivity
   ============================================ */

// ---------- SUPABASE CONFIG (config.js'den gelir) ----------
const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_KEY = window.SUPABASE_KEY;


// ---------- CONFIG (iş bilgileri) ----------
const CONFIG = {
  business: {
    name: "Mâverâ Cafe & Restoran",
    address: "Abdurrahmangazi, Balarısı Sk. 4b, 34920 Sultanbeyli/İstanbul",
    hours: "Her gün 09:00 – 02:00",
    phone1_display: "0507 200 25 05",
    phone1_raw: "+905072002505",
    whatsapp_url: "https://wa.me/905072002505",
    instagram: "https://www.instagram.com/mavera_cafelounge/",
    instagram_handle: "@mavera_cafelounge",
    maps: "https://maps.app.goo.gl/pwgW2uNVkEbayZvw6"
  },

  products: [] // Başlangıçta boş, Supabase'den dolacak
};

const CATEGORY_EMOJI_DEFAULT = "🍽️";

// ============================================
// SUPABASE FETCH HELPERS
// ============================================
async function sbGet(table, params = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${params}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Accept': 'application/json'
    }
  });
  if (!res.ok) throw new Error(`${table} yüklenemedi: ${res.status}`);
  return res.json();
}

// ============================================
// HEADER SCROLL + MOBILE MENU
// ============================================
function initHeader() {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const backdrop = document.querySelector('.nav-backdrop');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toggle && mobileNav && backdrop) {
    const closeBtn = mobileNav.querySelector('.mobile-nav-close');
    const closeMenu = () => {
      toggle.classList.remove('open');
      mobileNav.classList.remove('open');
      backdrop.classList.remove('open');
      document.body.style.overflow = '';
      toggle.setAttribute('aria-expanded', 'false');
    };
    const openMenu = () => {
      toggle.classList.add('open');
      mobileNav.classList.add('open');
      backdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
      toggle.setAttribute('aria-expanded', 'true');
    };
    toggle.addEventListener('click', () => {
      if (mobileNav.classList.contains('open')) closeMenu();
      else openMenu();
    });
    backdrop.addEventListener('click', closeMenu);
    closeBtn?.addEventListener('click', closeMenu);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileNav.classList.contains('open')) closeMenu();
    });
    mobileNav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  }
}

// ============================================
// SCROLL REVEAL (IntersectionObserver)
// ============================================
function initReveal(scope) {
  const items = (scope || document).querySelectorAll('.reveal:not(.visible)');
  if (!items.length) return;
  if (!('IntersectionObserver' in window)) {
    items.forEach(i => i.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });
  items.forEach(i => io.observe(i));
}

// ============================================
// ÜRÜN YÜKLEMESİ — Supabase → fallback
// ============================================
async function loadProducts() {
  try {
    const data = await sbGet('products', '?select=*&order=category_order,category,sort_order,name');
    if (data && data.length > 0) {
      CONFIG.products = data;
      console.log(`✅ Supabase'den ${data.length} ürün yüklendi.`);
    }
  } catch (err) {
    console.error('⚠️ Supabase bağlantı hatası:', err.message);
  }
}

// ============================================
// YÜKLENİYOR DURUMU
// ============================================
function renderLoadingState() {
  const grid = document.getElementById('featuredGrid');
  if (grid) grid.innerHTML = `<div class="loading-state">Ürünler yükleniyor…</div>`;
  const menuContainer = document.getElementById('menuContainer');
  if (menuContainer) menuContainer.innerHTML = `<div class="loading-state">Menü yükleniyor…</div>`;
}

// ============================================
// FEATURED PRODUCTS RENDER (Anasayfa)
// ============================================
function renderFeatured() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  const featured = CONFIG.products.slice(0, 5);
  grid.innerHTML = featured.map(p => `
    <article class="product-card reveal" aria-label="${p.name}">
      <div class="product-visual">
        <span class="product-cat">${p.category}</span>
        ${p.image_url
      ? `<img class="product-photo" src="${p.image_url}" alt="${p.name}" loading="lazy" />`
      : ``
    }
      </div>
      <div class="product-body">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.ingredients}</p>
        <div class="product-foot">
          <span class="product-price">${p.price}<span class="tl">TL</span></span>
          <a href="menu.html" class="product-more">Menü →</a>
        </div>
      </div>
    </article>
  `).join('');
  initReveal(grid);
}

// ============================================
// MENU PAGE RENDER (menu.html) — Akordeon
// ============================================
function renderMenu() {
  const menuContainer = document.getElementById('menuContainer');
  if (!menuContainer) return;

  const grouped = {};
  const order = [];
  CONFIG.products.forEach(p => {
    if (!grouped[p.category]) { grouped[p.category] = []; order.push(p.category); }
    grouped[p.category].push(p);
  });

  menuContainer.innerHTML = order.map((cat) => {
    const items = grouped[cat];
    const bannerImg = items.find(p => p.image_url)?.image_url || '';
    return `
    <section class="acc-item" id="cat-${slugify(cat)}" data-cat="${cat}">
      <button class="acc-header" type="button" aria-expanded="false">
        <span class="acc-header-bg" style="${bannerImg ? `background-image:url('${bannerImg}')` : ''}"></span>
        <span class="acc-header-overlay"></span>
        <span class="acc-header-count">${items.length} ürün</span>
        <span class="acc-header-title">${cat}</span>
        <span class="acc-chevron" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </span>
      </button>
      <div class="acc-panel">
        <div class="acc-panel-inner">
          <div class="menu-row-list">
            ${items.map(p => `
              <div class="menu-row" data-name="${normalizeTr(p.name)}">
                ${p.image_url ? `
                <div class="menu-row-thumb">
                  <img src="${p.image_url}" alt="${p.name}" loading="lazy" />
                </div>` : ''}
                <div class="menu-row-body" style="${!p.image_url ? 'padding-left:0' : ''}">
                  <h3 class="menu-row-name">${p.name}</h3>
                  ${p.ingredients ? `<p class="menu-row-desc">${p.ingredients}</p>` : ''}
                  <span class="menu-row-price">₺${p.price}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>
  `;
  }).join('') + `<p class="menu-no-results" id="menuNoResults" hidden>Aradığınız ürün bulunamadı. Farklı bir kelime deneyin.</p>`;

  initAccordion(menuContainer);
  initMenuSearch(menuContainer);
}

// ============================================
// ARAMA
// ============================================
function initMenuSearch(menuContainer) {
  const input = document.getElementById('menuSearch');
  const clearBtn = document.getElementById('menuSearchClear');
  const noResults = document.getElementById('menuNoResults');
  if (!input) return;

  const accItems = Array.from(menuContainer.querySelectorAll('.acc-item'));

  function applyFilter(term) {
    const q = normalizeTr(term.trim());
    clearBtn.hidden = q.length === 0;

    if (!q) {
      accItems.forEach(item => {
        item.hidden = false;
        item.querySelectorAll('.menu-row').forEach(row => row.hidden = false);
        closeAccordionItem(item);
      });
      noResults.hidden = true;
      return;
    }

    let anyVisible = false;
    accItems.forEach(item => {
      const rows = Array.from(item.querySelectorAll('.menu-row'));
      let matchInCat = false;
      rows.forEach(row => {
        const match = row.dataset.name.includes(q);
        row.hidden = !match;
        if (match) matchInCat = true;
      });
      item.hidden = !matchInCat;
      if (matchInCat) {
        anyVisible = true;
        openAccordionItem(item);
      }
    });
    noResults.hidden = anyVisible;
  }

  input.addEventListener('input', () => applyFilter(input.value));
  clearBtn.addEventListener('click', () => {
    input.value = '';
    applyFilter('');
    input.focus();
  });
}

// ============================================
// TÜRKÇE NORMALİZASYON
// ============================================
function normalizeTr(str) {
  return str
    .toLocaleLowerCase('tr-TR')
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i')
    .replace(/İ/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u');
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
    .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// ============================================
// AKORDEON
// ============================================
function openAccordionItem(item) {
  const header = item.querySelector('.acc-header');
  const panel = item.querySelector('.acc-panel');
  item.classList.add('open');
  header.setAttribute('aria-expanded', 'true');
  panel.style.maxHeight = panel.scrollHeight + 'px';
}

function closeAccordionItem(item) {
  const header = item.querySelector('.acc-header');
  const panel = item.querySelector('.acc-panel');
  item.classList.remove('open');
  header.setAttribute('aria-expanded', 'false');
  panel.style.maxHeight = '0px';
}

function initAccordion(scope) {
  const headers = scope.querySelectorAll('.acc-header');
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.acc-item');
      if (item.classList.contains('open')) closeAccordionItem(item);
      else openAccordionItem(item);
    });
  });

  scope.querySelectorAll('.acc-panel img').forEach(img => {
    img.addEventListener('load', () => {
      const item = img.closest('.acc-item');
      if (item && item.classList.contains('open')) {
        const panel = item.querySelector('.acc-panel');
        panel.style.maxHeight = panel.scrollHeight + 'px';
      }
    });
  });
}

// ============================================
// KAMPANYA POP-UP (menu.html)
// Supabase'den çeker — kayıt yoksa modal açılmaz.
// ============================================
async function initCampaignModal() {
  const backdrop = document.getElementById('campaignModal');
  if (!backdrop) return;

  let imageUrl = '';
  try {
    const data = await sbGet('campaigns', '?select=image_url&order=created_at.desc&limit=1');
    if (data && data.length > 0) imageUrl = data[0].image_url;
  } catch (err) {
    console.warn('Kampanya yüklenemedi:', err.message);
  }

  if (!imageUrl) return; // Görsel yoksa modal açılmaz

  const img = document.getElementById('campaignImg');
  if (img) {
    img.src = imageUrl;
    img.style.display = 'block';
  }

  const closeBtn = backdrop.querySelector('.campaign-close');
  const open = () => {
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
  };

  closeBtn?.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  setTimeout(open, 400);
}

// ============================================
// BAŞLATMA
// ============================================
(async function init() {
  initHeader();
  renderLoadingState();
  await loadProducts();
  renderFeatured();
  renderMenu();
  await initCampaignModal();
  initReveal(document);

  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 70;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
})();