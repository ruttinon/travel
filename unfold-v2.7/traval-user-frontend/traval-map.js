/**
 * Traval Platform — Map & Real-Time Location Component
 * Features:
 * - Live Location tracking (Blue Dot with accuracy pulse & heading cone)
 * - My Location re-center button
 * - Follow Me continuous tracking mode (auto-pauses on user drag/pan)
 * - Marker Clustering for dense areas
 * - Search This Area detector
 */
'use strict';

import { clusterPlaces, calculateDistanceKm } from './traval-mock-data.js';

export class TravalMapComponent {
  constructor(options = {}) {
    this.container = typeof options.container === 'string' ? document.querySelector(options.container) : options.container;
    this.places = options.places || [];
    this.center = options.center || { lat: 18.868, lon: 99.35, zoom: 11 };
    this.userLocation = null;
    this.watchId = null;
    this.isFollowing = false;
    this.activePlaceId = options.activePlaceId || null;
    this.onSelectPlace = options.onSelectPlace || (() => {});
    this.onSearchArea = options.onSearchArea || (() => {});

    this.isDragging = false;
    this.dragStart = { x: 0, y: 0 };
    this.centerStart = { lat: 0, lon: 0 };
    this.hasPannedAway = false;
    this.heading = 0;

    this.init();
  }

  init() {
    if (!this.container) return;
    this.container.classList.add('map-container-wrapper');
    this.renderBaseDOM();
    this.setupEvents();
    this.drawTiles();
    this.renderMarkers();
    this.startLocationWatch();
  }

  renderBaseDOM() {
    this.container.innerHTML = `
      <div class="map-viewport" id="map-viewport" style="position:absolute;inset:0;overflow:hidden;cursor:grab;">
        <div class="map-tile-layer" id="map-tile-layer" style="position:absolute;inset:0;pointer-events:none;"></div>
        <div class="map-marker-layer" id="map-marker-layer" style="position:absolute;inset:0;"></div>
      </div>
      
      <!-- Floating Search This Area Button -->
      <button class="btn-search-this-area" id="btn-search-area" style="display:none;" aria-label="ค้นหาบริเวณนี้">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <span>ค้นหาบริเวณนี้ (Search This Area)</span>
      </button>

      <!-- Floating Map Controls -->
      <div class="map-floating-controls">
        <button class="map-btn map-btn-follow" id="btn-follow-me" aria-label="Follow Me" title="ติดตามตำแหน่งเรียลไทม์">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="3 11 22 2 13 21 11 13 3 11"/>
          </svg>
          <span class="follow-text">Follow Me</span>
        </button>

        <button class="map-btn" id="btn-my-location" aria-label="ตำแหน่งปัจจุบัน (My Location)" title="กลับไปยังตำแหน่งของฉัน">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>
          </svg>
        </button>

        <button class="map-btn" id="btn-zoom-in" aria-label="ซูมเข้า" title="Zoom in">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>

        <button class="map-btn" id="btn-zoom-out" aria-label="ซูมออก" title="Zoom out">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>

      <div class="map-attribution" style="position:absolute;bottom:6px;left:12px;font-size:10px;color:#78857B;background:rgba(255,255,255,0.7);padding:2px 6px;border-radius:4px;pointer-events:none;">
        © OpenStreetMap · Traval Live Map
      </div>
    `;

    this.viewport = this.container.querySelector('#map-viewport');
    this.tileLayer = this.container.querySelector('#map-tile-layer');
    this.markerLayer = this.container.querySelector('#map-marker-layer');
    this.btnSearchArea = this.container.querySelector('#btn-search-area');
    this.btnMyLocation = this.container.querySelector('#btn-my-location');
    this.btnFollowMe = this.container.querySelector('#btn-follow-me');
    this.btnZoomIn = this.container.querySelector('#btn-zoom-in');
    this.btnZoomOut = this.container.querySelector('#btn-zoom-out');
  }

  setupEvents() {
    // Zoom controls
    this.btnZoomIn.addEventListener('click', () => this.zoom(1));
    this.btnZoomOut.addEventListener('click', () => this.zoom(-1));

    // My Location Click
    this.btnMyLocation.addEventListener('click', () => {
      if (this.userLocation) {
        this.centerOn(this.userLocation.lat, this.userLocation.lon, 14);
      } else {
        this.requestGPSImmediate();
      }
    });

    // Follow Me Toggle
    this.btnFollowMe.addEventListener('click', () => {
      this.isFollowing = !this.isFollowing;
      this.updateFollowUI();
      if (this.isFollowing && this.userLocation) {
        this.centerOn(this.userLocation.lat, this.userLocation.lon);
      }
    });

    // Search This Area Button
    this.btnSearchArea.addEventListener('click', () => {
      this.btnSearchArea.style.display = 'none';
      this.hasPannedAway = false;
      this.onSearchArea(this.center);
    });

    // Mouse & Touch Dragging for Map
    const startDrag = (x, y) => {
      this.isDragging = true;
      this.dragStart = { x, y };
      this.centerStart = { ...this.center };
      this.viewport.style.cursor = 'grabbing';
      
      // Auto-pause Follow Me when user manually pans!
      if (this.isFollowing) {
        this.isFollowing = false;
        this.updateFollowUI();
      }
    };

    const moveDrag = (x, y) => {
      if (!this.isDragging) return;
      const dx = x - this.dragStart.x;
      const dy = y - this.dragStart.y;
      
      const scale = 256 * (2 ** this.center.zoom);
      const dLon = - (dx / scale) * 360;
      const n = Math.PI - 2 * Math.PI * (this.latToY(this.centerStart.lat, this.center.zoom) - dy) / scale;
      const newLat = (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));

      this.center.lon = this.centerStart.lon + dLon;
      this.center.lat = isNaN(newLat) ? this.centerStart.lat : Math.max(-85, Math.min(85, newLat));

      this.drawTiles();
      this.renderMarkers();

      // Show Search This Area after panning a distance
      if (!this.hasPannedAway && (Math.abs(dx) > 60 || Math.abs(dy) > 60)) {
        this.hasPannedAway = true;
        this.btnSearchArea.style.display = 'inline-flex';
      }
    };

    const endDrag = () => {
      this.isDragging = false;
      this.viewport.style.cursor = 'grab';
    };

    // Pointer listeners
    this.viewport.addEventListener('mousedown', e => {
      if (e.target.closest('.traval-map-pin') || e.target.closest('.marker-cluster-badge')) return;
      startDrag(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', e => moveDrag(e.clientX, e.clientY));
    window.addEventListener('mouseup', endDrag);

    // Touch events for mobile
    this.viewport.addEventListener('touchstart', e => {
      if (e.touches.length === 1 && !e.target.closest('.traval-map-pin')) {
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
    window.addEventListener('touchmove', e => {
      if (e.touches.length === 1) moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    window.addEventListener('touchend', endDrag);

    // Orientation Compass support
    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', e => {
        if (e.webkitCompassHeading) {
          this.heading = e.webkitCompassHeading;
        } else if (e.alpha) {
          this.heading = 360 - e.alpha;
        }
        this.updateHeadingCone();
      }, true);
    }
  }

  updateFollowUI() {
    this.btnFollowMe.classList.toggle('active', this.isFollowing);
    const followText = this.btnFollowMe.querySelector('.follow-text');
    if (followText) {
      followText.textContent = this.isFollowing ? 'Following' : 'Follow Me';
    }
  }

  zoom(delta) {
    const nextZoom = Math.max(4, Math.min(18, this.center.zoom + delta));
    if (nextZoom !== this.center.zoom) {
      this.center.zoom = nextZoom;
      this.drawTiles();
      this.renderMarkers();
    }
  }

  centerOn(lat, lon, zoom = null) {
    this.center.lat = lat;
    this.center.lon = lon;
    if (zoom) this.center.zoom = zoom;
    this.drawTiles();
    this.renderMarkers();
  }

  // Web Mercator projections
  project(lat, lon, z = this.center.zoom) {
    const scale = 256 * (2 ** z);
    const s = Math.sin(Math.max(-85, Math.min(85, lat)) * Math.PI / 180);
    return {
      x: (lon + 180) / 360 * scale,
      y: (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale
    };
  }

  latToY(lat, z) {
    return this.project(lat, 0, z).y;
  }

  drawTiles() {
    const w = this.viewport.offsetWidth;
    const h = this.viewport.offsetHeight;
    if (!w || !h) return;

    const origin = this.project(this.center.lat, this.center.lon, this.center.zoom);
    const z = this.center.zoom;
    const max = 2 ** z;

    const txMin = Math.floor((origin.x - w / 2) / 256);
    const txMax = Math.ceil((origin.x + w / 2) / 256);
    const tyMin = Math.floor((origin.y - h / 2) / 256);
    const tyMax = Math.ceil((origin.y + h / 2) / 256);

    this.tileLayer.innerHTML = '';
    const frag = document.createDocumentFragment();

    let count = 0;
    for (let x = txMin; x <= txMax; x++) {
      for (let y = tyMin; y <= tyMax; y++) {
        if (y < 0 || y >= max || count++ > 48) continue;
        const tile = document.createElement('img');
        tile.alt = '';
        tile.draggable = false;
        tile.loading = 'lazy';
        tile.style.position = 'absolute';
        tile.style.width = '256px';
        tile.style.height = '256px';
        tile.style.left = `${x * 256 - origin.x + w / 2}px`;
        tile.style.top = `${y * 256 - origin.y + h / 2}px`;
        tile.src = `https://tile.openstreetmap.org/${z}/${((x % max) + max) % max}/${y}.png`;
        frag.appendChild(tile);
      }
    }
    this.tileLayer.appendChild(frag);
  }

  renderMarkers() {
    const w = this.viewport.offsetWidth;
    const h = this.viewport.offsetHeight;
    if (!w || !h) return;

    const origin = this.project(this.center.lat, this.center.lon, this.center.zoom);
    this.markerLayer.innerHTML = '';

    // Cluster places according to current zoom
    const clusterRadiusDeg = Math.max(0.005, 0.45 / (2 ** (this.center.zoom - 8)));
    const clusters = clusterPlaces(this.places, clusterRadiusDeg);

    clusters.forEach(item => {
      const pos = this.project(item.lat, item.lon, this.center.zoom);
      const px = pos.x - origin.x + w / 2;
      const py = pos.y - origin.y + h / 2;

      // Skip offscreen
      if (px < -60 || px > w + 60 || py < -60 || py > h + 60) return;

      if (item.isCluster) {
        const clusterBadge = document.createElement('button');
        clusterBadge.className = `marker-cluster-badge ${item.hasSme ? 'cluster-has-sme' : ''}`;
        clusterBadge.style.left = `${px}px`;
        clusterBadge.style.top = `${py}px`;
        clusterBadge.innerHTML = `<span>${item.count}</span>`;
        clusterBadge.title = `${item.count} สถานที่ในบริเวณนี้`;

        clusterBadge.addEventListener('click', e => {
          e.stopPropagation();
          // Zoom into cluster center
          this.centerOn(item.lat, item.lon, Math.min(16, this.center.zoom + 2));
        });

        this.markerLayer.appendChild(clusterBadge);
      } else {
        const pin = document.createElement('div');
        const isActive = this.activePlaceId === item.id;
        pin.className = `traval-map-pin ${item.isSme ? 'pin-sme' : ''} ${isActive ? 'active' : ''}`;
        pin.style.left = `${px}px`;
        pin.style.top = `${py}px`;
        pin.dataset.id = item.id;

        pin.innerHTML = `
          <div class="pin-bubble" style="width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${item.isSme ? '#E5A836' : '#0D2C1C'};border:2px solid #FFF;box-shadow:0 6px 14px rgba(0,0,0,0.25);display:grid;place-items:center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="transform:rotate(45deg);color:#FFF;">
              ${item.isSme ? '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>' : '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>'}
            </svg>
          </div>
        `;

        pin.addEventListener('click', e => {
          e.stopPropagation();
          this.activePlaceId = item.id;
          this.renderMarkers();
          this.onSelectPlace(item);
        });

        this.markerLayer.appendChild(pin);
      }
    });

    // Render Live Location Blue Dot if available
    this.renderLiveBlueDot(origin, w, h);
  }

  renderLiveBlueDot(origin, w, h) {
    if (!this.userLocation) return;
    const pos = this.project(this.userLocation.lat, this.userLocation.lon, this.center.zoom);
    const px = pos.x - origin.x + w / 2;
    const py = pos.y - origin.y + h / 2;

    const dotContainer = document.createElement('div');
    dotContainer.style.position = 'absolute';
    dotContainer.style.left = `${px}px`;
    dotContainer.style.top = `${py}px`;
    dotContainer.style.pointerEvents = 'none';
    dotContainer.id = 'live-location-element';

    dotContainer.innerHTML = `
      <div class="live-blue-dot-accuracy"></div>
      <div class="live-heading-cone" id="live-heading-cone" style="transform:rotate(${this.heading}deg);"></div>
      <div class="live-blue-dot" title="ตำแหน่งของคุณ (You Are Here)"></div>
    `;

    this.markerLayer.appendChild(dotContainer);
  }

  updateHeadingCone() {
    const cone = this.container.querySelector('#live-heading-cone');
    if (cone) {
      cone.style.transform = `rotate(${this.heading}deg)`;
    }
  }

  startLocationWatch() {
    if (!('geolocation' in navigator)) return;

    this.watchId = navigator.geolocation.watchPosition(
      pos => {
        this.userLocation = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };

        if (this.isFollowing) {
          this.center.lat = this.userLocation.lat;
          this.center.lon = this.userLocation.lon;
          this.drawTiles();
        }

        this.renderMarkers();
      },
      err => {
        console.warn('Geolocation error:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );
  }

  requestGPSImmediate() {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.userLocation = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy
        };
        this.centerOn(this.userLocation.lat, this.userLocation.lon, 14);
      },
      err => {
        alert('กรุณาเปิดการใช้งาน Location บนเบราว์เซอร์เพื่อสำรวจสถานที่รอบตัวคุณ');
      },
      { enableHighAccuracy: true }
    );
  }

  updatePlaces(newPlaces) {
    this.places = newPlaces;
    this.renderMarkers();
  }

  destroy() {
    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
    }
  }
}
