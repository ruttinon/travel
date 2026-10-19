/**
 * Traval Platform — Your Collection Component
 * Features:
 * - Reactive LocalStorage persistence
 * - Grouping & filtering by Province / Category / Local SME Only
 * - Real-time badge counter synchronization across the application
 */
'use strict';

const STORAGE_KEY = 'traval_user_saved_collection';

export class TravalCollectionManager {
  constructor(options = {}) {
    this.container = typeof options.container === 'string' ? document.querySelector(options.container) : options.container;
    this.allPlaces = options.places || [];
    this.savedIds = this.loadFromStorage();
    this.activeFilter = 'all'; // 'all', 'sme', or province id
    this.onSelectPlace = options.onSelectPlace || (() => {});
    this.onCountChange = options.onCountChange || (() => {});

    this.init();
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : ['sme-mae-kampong-coffee', 'sme-talad-noi-noodle'];
    } catch (e) {
      return [];
    }
  }

  saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.savedIds));
      this.notifyCount();
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  notifyCount() {
    const count = this.savedIds.length;
    this.onCountChange(count);
    // Dispatch custom event for navbar badge
    window.dispatchEvent(new CustomEvent('traval-collection-updated', { detail: { count } }));
  }

  has(id) {
    return this.savedIds.includes(id);
  }

  toggle(place) {
    const index = this.savedIds.indexOf(place.id);
    const added = index === -1;
    if (added) {
      this.savedIds.push(place.id);
    } else {
      this.savedIds.splice(index, 1);
    }
    this.saveToStorage();
    this.render();
    return added;
  }

  remove(id) {
    this.savedIds = this.savedIds.filter(x => x !== id);
    this.saveToStorage();
    this.render();
  }

  init() {
    this.notifyCount();
    this.render();
  }

  getSavedPlaces() {
    return this.allPlaces.filter(p => this.savedIds.includes(p.id));
  }

  getFilteredPlaces() {
    const list = this.getSavedPlaces();
    if (this.activeFilter === 'sme') {
      return list.filter(p => p.isSme);
    }
    if (this.activeFilter !== 'all') {
      return list.filter(p => p.province === this.activeFilter);
    }
    return list;
  }

  getProvinces() {
    const provinces = new Map();
    this.getSavedPlaces().forEach(p => {
      if (p.province && !provinces.has(p.province)) {
        provinces.set(p.province, p.provinceNameTh || p.provinceNameEn);
      }
    });
    return Array.from(provinces.entries());
  }

  render() {
    if (!this.container) return;
    const places = this.getFilteredPlaces();
    const provinces = this.getProvinces();

    this.container.innerHTML = `
      <div class="traval-collection-wrap" style="padding: 10px 0 40px 0;">
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:20px;">
          <div>
            <span style="font-size:11px;font-weight:700;letter-spacing:1px;color:var(--traval-lime-deep);text-transform:uppercase;">
              YOUR SAVED SPACE
            </span>
            <h1 style="font-size:28px;font-weight:700;color:var(--traval-forest);margin:4px 0 0 0;">
              สถานที่ของฉัน (Your Collection)
            </h1>
          </div>
          <div style="font-size:13px;font-weight:600;color:var(--traval-ink-muted);background:var(--traval-surface);padding:6px 14px;border-radius:var(--radius-pill);border:1px solid var(--traval-border);">
            บันทึกไว้ <strong style="color:var(--traval-forest);">${this.savedIds.length}</strong> แห่ง
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="traval-chips-container" style="margin-bottom:20px;">
          <button class="traval-chip ${this.activeFilter === 'all' ? 'active' : ''}" data-filter="all">
            <span>ทั้งหมด (${this.savedIds.length})</span>
          </button>
          <button class="traval-chip chip-sme ${this.activeFilter === 'sme' ? 'active' : ''}" data-filter="sme">
            <span>★ ร้านค้าชุมชน SME</span>
          </button>
          ${provinces.map(([key, name]) => `
            <button class="traval-chip ${this.activeFilter === key ? 'active' : ''}" data-filter="${key}">
              <span>📍 ${name}</span>
            </button>
          `).join('')}
        </div>

        <!-- List / Grid -->
        ${places.length ? `
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(280px, 1fr));gap:16px;">
            ${places.map(p => `
              <article class="sme-card" style="flex:auto;" data-id="${p.id}">
                <div class="sme-card-image" style="height:150px;">
                  <img src="assets/${p.photo || 'hero-forest.webp'}" alt="${p.th || p.en}" loading="lazy"/>
                  <div class="sme-card-badge-container">
                    ${p.isSme ? `<span class="badge-sme-spotlight">★ Local SME</span>` : ''}
                  </div>
                  <button class="btn-heart-favorite saved" data-action="remove" data-id="${p.id}" style="position:absolute;top:10px;right:10px;width:34px;height:34px;" title="นำออกจากที่บันทึก">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                    </svg>
                  </button>
                </div>
                <div class="sme-card-body">
                  <h3 class="sme-card-title" style="font-size:16px;">${p.th || p.en}</h3>
                  <div class="sme-card-loc">📍 ${p.locTh || p.locEn}</div>
                  <div class="sme-card-footer">
                    <span style="font-size:12px;color:var(--traval-lime-deep);font-weight:700;">★ ${p.rating || '4.8'}</span>
                    <button class="sheet-action-btn" data-action="view" data-id="${p.id}" style="background:var(--traval-forest);color:#FFF;font-size:12px;font-weight:600;padding:6px 14px;border-radius:var(--radius-pill);">
                      ดูรายละเอียด →
                    </button>
                  </div>
                </div>
              </article>
            `).join('')}
          </div>
        ` : `
          <div style="background:var(--traval-surface);border:1px dashed var(--traval-border);border-radius:var(--radius-lg);padding:60px 20px;text-align:center;color:var(--traval-ink-muted);">
            <div style="font-size:42px;margin-bottom:12px;">🌿</div>
            <h3 style="font-size:18px;color:var(--traval-forest);margin:0 0 6px 0;">ยังไม่มีสถานที่ในหมวดหมู่นี้</h3>
            <p style="font-size:13px;margin:0 0 18px 0;">กดสัญลักษณ์รูปหัวใจบนการ์ดสถานที่เพื่อบันทึกไว้ในคอลเลกชันส่วนตัว</p>
          </div>
        `}
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    // Filter chips click
    this.container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', e => {
        this.activeFilter = btn.dataset.filter;
        this.render();
      });
    });

    // Remove buttons
    this.container.querySelectorAll('[data-action="remove"]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        this.remove(btn.dataset.id);
      });
    });

    // View buttons
    this.container.querySelectorAll('[data-action="view"]').forEach(btn => {
      btn.addEventListener('click', e => {
        const place = this.allPlaces.find(p => p.id === btn.dataset.id);
        if (place) this.onSelectPlace(place);
      });
    });
  }
}
