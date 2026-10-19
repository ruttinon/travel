/**
 * Traval Platform — Place Detail Bottom Sheet Component
 * Mobile-first 3-stage draggable sheet (Peek / Half / Full) with touch gesture physics
 */
'use strict';

export class TravalBottomSheet {
  constructor(options = {}) {
    this.container = typeof options.container === 'string' ? document.querySelector(options.container) : options.container;
    this.place = options.place || null;
    this.state = options.initialState || 'closed'; // 'peek', 'half', 'full', 'closed'
    this.onSaveToggle = options.onSaveToggle || (() => {});
    this.isSaved = options.isSaved || false;

    this.startY = 0;
    this.currentTranslateY = 0;
    this.isDragging = false;

    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
    this.setupGestures();
  }

  setPlace(place, isSaved = false, targetState = 'half') {
    this.place = place;
    this.isSaved = isSaved;
    this.state = targetState;
    this.render();
    this.applyState();
  }

  close() {
    this.state = 'closed';
    this.applyState();
  }

  applyState() {
    if (!this.sheetEl) return;
    this.sheetEl.className = `traval-bottom-sheet state-${this.state}`;
    this.sheetEl.style.transform = '';
  }

  render() {
    if (!this.place) {
      this.container.innerHTML = `<div class="traval-bottom-sheet state-closed" id="traval-sheet"></div>`;
      this.sheetEl = this.container.querySelector('#traval-sheet');
      return;
    }

    const p = this.place;
    const isThai = true; // Primary interface
    const title = p.th || p.en;
    const location = p.locTh || p.locEn;
    const story = p.storyTh || p.storyEn;
    const specialties = (p.specialtiesTh || p.specialtiesEn || []);

    this.container.innerHTML = `
      <div class="traval-bottom-sheet state-${this.state}" id="traval-sheet">
        <!-- Touch Drag Bar -->
        <div class="sheet-drag-handle-bar" id="sheet-drag-handle" title="ลากเพื่อปรับระดับ">
          <div class="sheet-drag-pill"></div>
        </div>

        <div class="sheet-scroll-content">
          <!-- Header Image and Badges -->
          <div style="position:relative;border-radius:18px;overflow:hidden;height:180px;margin-bottom:16px;background:#CBD5E1;">
            <img src="assets/${p.photo || 'hero-forest.webp'}" alt="${title}" style="width:100%;height:100%;object-fit:cover;" />
            <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.65) 100%);"></div>
            
            <div style="position:absolute;top:12px;left:12px;display:flex;gap:6px;">
              ${p.isSme ? `<span class="badge-sme-spotlight">★ ${p.smeBadge || 'Local SME Spotlight'}</span>` : ''}
              <span class="badge-open-status ${p.isOpen ? 'open' : 'closed'}" style="background:rgba(255,255,255,0.92);padding:3px 10px;border-radius:99px;">
                ${p.isOpen ? 'เปิดอยู่' : 'ปิดแล้ว'}
              </span>
            </div>

            <div style="position:absolute;bottom:12px;left:14px;right:14px;color:#FFF;display:flex;justify-content:space-between;align-items:flex-end;">
              <div>
                <span style="font-size:11px;opacity:0.9;">📍 ${location}</span>
                <h2 style="margin:2px 0 0 0;font-size:20px;font-weight:700;line-height:1.2;">${title}</h2>
              </div>
              <div style="background:rgba(255,255,255,0.25);backdrop-filter:blur(8px);border-radius:10px;padding:4px 8px;font-size:12px;font-weight:700;">
                ★ ${p.rating || '4.8'} (${p.reviewsCount || 40})
              </div>
            </div>
          </div>

          <!-- Quick Action Buttons Row -->
          <div style="display:flex;gap:10px;margin-bottom:18px;">
            <button class="sheet-action-btn" id="btn-sheet-directions" style="flex:1;background:var(--traval-lime);color:#0D2C1C;font-weight:700;padding:12px 14px;border-radius:var(--radius-pill);display:inline-flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 4px 12px rgba(141,224,38,0.3);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <polygon points="3 11 22 2 13 21 11 13 3 11"/>
              </svg>
              <span>นำทาง (Directions)</span>
            </button>

            <button class="btn-heart-favorite ${this.isSaved ? 'saved' : ''}" id="btn-sheet-heart" aria-label="บันทึกสถานที่โปรด" title="บันทึกเป็นสถานที่โปรด">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="${this.isSaved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>

            <button class="btn-heart-favorite" id="btn-sheet-share" aria-label="แชร์" title="แชร์สถานที่">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </button>

            ${p.phone ? `
              <a href="tel:${p.phone}" class="btn-heart-favorite" style="text-decoration:none;" title="โทรสอบถามร้าน">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
              </a>
            ` : ''}
          </div>

          <!-- Local Story Quote Section -->
          ${story ? `
            <div class="sme-story-box">
              <strong style="color:var(--traval-forest);display:block;margin-bottom:4px;font-style:normal;">📖 เรื่องเล่าชุมชน (Local Story):</strong>
              "${story}"
            </div>
          ` : ''}

          <!-- Specialties Chips -->
          ${specialties.length ? `
            <div style="margin-bottom:18px;">
              <span style="font-size:12px;font-weight:700;color:var(--traval-forest);display:block;margin-bottom:8px;">
                ✨ สินค้า & เมนูแนะนำ:
              </span>
              <div style="display:flex;flex-wrap:wrap;gap:6px;">
                ${specialties.map(item => `
                  <span style="background:var(--traval-surface-alt);border:1px solid var(--traval-border);color:var(--traval-forest);font-size:12px;padding:4px 10px;border-radius:var(--radius-pill);">
                    ${item}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Detail Info Grid -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px;background:var(--traval-surface-alt);border-radius:var(--radius-md);margin-bottom:18px;">
            <div>
              <span style="font-size:11px;color:var(--traval-ink-muted);display:block;">เวลาเปิด–ปิด</span>
              <strong style="font-size:13px;color:var(--traval-forest);">${p.openHours || 'ทุกวัน'}</strong>
            </div>
            <div>
              <span style="font-size:11px;color:var(--traval-ink-muted);display:block;">ราคาเริ่มต้น</span>
              <strong style="font-size:13px;color:var(--traval-forest);">${p.priceFrom ? `฿${p.priceFrom.toLocaleString()}` : 'ฟรี / ไม่มีค่าเข้า'}</strong>
            </div>
          </div>
        </div>
      </div>
    `;

    this.sheetEl = this.container.querySelector('#traval-sheet');
    this.bindActionEvents();
  }

  bindActionEvents() {
    if (!this.sheetEl || !this.place) return;

    // Directions
    const btnDirections = this.sheetEl.querySelector('#btn-sheet-directions');
    if (btnDirections) {
      btnDirections.addEventListener('click', () => {
        const dest = `${this.place.lat},${this.place.lon}`;
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank', 'noopener,noreferrer');
      });
    }

    // Heart Save
    const btnHeart = this.sheetEl.querySelector('#btn-sheet-heart');
    if (btnHeart) {
      btnHeart.addEventListener('click', () => {
        this.isSaved = !this.isSaved;
        btnHeart.classList.toggle('saved', this.isSaved);
        btnHeart.querySelector('svg').setAttribute('fill', this.isSaved ? 'currentColor' : 'none');
        this.onSaveToggle(this.place, this.isSaved);
      });
    }

    // Share
    const btnShare = this.sheetEl.querySelector('#btn-sheet-share');
    if (btnShare) {
      btnShare.addEventListener('click', async () => {
        const shareData = {
          title: this.place.th || this.place.en,
          text: `ค้นพบ ${this.place.th || this.place.en} บน Traval แพลตฟอร์มท่องเที่ยวชุมชน`,
          url: window.location.href
        };
        if (navigator.share) {
          try {
            await navigator.share(shareData);
          } catch (e) {
            console.log('Share dismissed');
          }
        } else {
          navigator.clipboard?.writeText(window.location.href);
          alert('คัดลอกลิงก์สถานที่แล้ว!');
        }
      });
    }
  }

  setupGestures() {
    const handle = this.sheetEl?.querySelector('#sheet-drag-handle');
    if (!handle) return;

    const onStart = clientY => {
      this.isDragging = true;
      this.startY = clientY;
      this.sheetEl.style.transition = 'none';
    };

    const onMove = clientY => {
      if (!this.isDragging) return;
      const deltaY = clientY - this.startY;
      if (deltaY > 0) {
        // Dragging downwards
        this.sheetEl.style.transform = `translateY(${deltaY}px)`;
      }
    };

    const onEnd = clientY => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.sheetEl.style.transition = '';
      const deltaY = clientY - this.startY;

      if (deltaY > 120) {
        // Dragged down significantly
        if (this.state === 'full') this.state = 'half';
        else if (this.state === 'half') this.state = 'peek';
        else this.state = 'closed';
      } else if (deltaY < -60) {
        // Dragged up
        if (this.state === 'peek') this.state = 'half';
        else if (this.state === 'half') this.state = 'full';
      }
      this.applyState();
    };

    handle.addEventListener('mousedown', e => onStart(e.clientY));
    window.addEventListener('mousemove', e => onMove(e.clientY));
    window.addEventListener('mouseup', e => onEnd(e.clientY));

    handle.addEventListener('touchstart', e => {
      if (e.touches.length === 1) onStart(e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchmove', e => {
      if (e.touches.length === 1) onMove(e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchend', e => {
      onEnd(e.changedTouches[0]?.clientY || 0);
    });
  }
}
