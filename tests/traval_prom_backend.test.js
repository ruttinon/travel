'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ROOT = path.resolve(__dirname, '..');

async function spawnServer(dir) {
  const proc = spawn(process.execPath, [path.join(ROOT, 'server.js')], {
    env: { ...process.env, UNFOLD_DATA_DIR: dir, UNFOLD_NO_BROWSER: '1', PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let url = '', setup = '';
  const ready = new Promise((resolve, reject) => {
    let buf = '';
    proc.stdout.on('data', chunk => {
      buf += chunk.toString('utf8');
      const mUrl = /http:\/\/127\.0\.0\.1:(\d+)\//.exec(buf);
      const mToken = /FIRST TIME SETUP[\s\S]*?([a-f0-9]{18})/.exec(buf);
      if (mUrl && !url) url = `http://127.0.0.1:${mUrl[1]}`;
      if (mToken && !setup) setup = mToken[1];
      if (url && setup) resolve({ proc, url, setup });
    });
    proc.stderr.on('data', d => console.error('[SERVER STDERR]', d.toString('utf8')));
    proc.once('exit', code => reject(new Error('Server exited early: ' + code)));
  });
  return ready;
}

async function request(base, endpoint, { method = 'GET', cookie, body, origin } = {}) {
  const headers = {};
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (origin) headers.Origin = origin;
  const res = await fetch(base + endpoint, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  let json = null;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, json, cookie: res.headers.get('set-cookie')?.split(';')[0] };
}

test('Prom Backend: SME First, Spotlight, Safety Reports & Admin Stats Lifecycle', async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'traval-prom-test-'));
  const dataDir = path.join(tmp, 'data');
  let run;

  try {
    run = await spawnServer(dataDir);
    const base = run.url;

    // 1. Setup Admin
    let r = await request(base, '/api/admin/setup', {
      method: 'POST',
      body: { setupToken: run.setup, password: 'SuperSecretAdmin2026!' },
      origin: base
    });
    assert.equal(r.status, 201);
    const adminCookie = r.cookie;

    // Upload an image for place cover
    const sampleImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    r = await request(base, '/api/admin/uploads', {
      method: 'POST',
      cookie: adminCookie,
      origin: base,
      body: { dataUrl: sampleImage }
    });
    assert.equal(r.status, 201);
    const coverUrl = r.json.url;

    // 2. Create Regular Place
    r = await request(base, '/api/admin/places', {
      method: 'POST',
      cookie: adminCookie,
      origin: base,
      body: {
        en: 'Grand Temple',
        th: 'วัดพระแก้วจำลอง',
        locEn: 'Bangkok, Thailand',
        locTh: 'กรุงเทพฯ',
        category: 'culture',
        region: 'central',
        lat: 13.750,
        lon: 100.490,
        visit: '2 hours',
        photo: coverUrl,
        priceFrom: 0,
        status: 'published',
        isSme: false
      }
    });
    assert.equal(r.status, 201, 'Place creation error: ' + JSON.stringify(r.json));
    assert.equal(r.json.place.isSme, false);

    // 3. Create SME Place with Spotlight Badge & Local Story
    r = await request(base, '/api/admin/places', {
      method: 'POST',
      cookie: adminCookie,
      origin: base,
      body: {
        en: 'Talat Noi Old Noodle House',
        th: 'ก๋วยเตี๋ยวโบราณตลาดน้อย',
        locEn: 'Talat Noi, Bangkok',
        locTh: 'ตลาดน้อย สัมพันธวงศ์ กรุงเทพฯ',
        category: 'food',
        region: 'central',
        lat: 13.734,
        lon: 100.513,
        visit: '1 hour',
        photo: coverUrl,
        priceFrom: 60,
        status: 'published',
        isSme: true,
        smeType: 'local_food',
        spotlightBadge: 'Local Pick',
        localStoryTh: 'สูตรบะหมี่ทำเองสืบทอด 3 รุ่นกว่า 60 ปี',
        localStoryEn: 'Handmade egg noodles recipe passed down 3 generations.',
        contactPhone: '0812345678',
        contactLine: '@talatnoinoodle'
      }
    });
    assert.equal(r.status, 201);
    const smePlace = r.json.place;
    assert.equal(smePlace.isSme, true);
    assert.equal(smePlace.spotlightBadge, 'Local Pick');
    assert.equal(smePlace.localStoryTh, 'สูตรบะหมี่ทำเองสืบทอด 3 รุ่นกว่า 60 ปี');

    // 4. Test Public SME Directory API: /api/places/sme
    r = await request(base, '/api/places/sme');
    assert.equal(r.status, 200);
    assert.equal(r.json.count, 1);
    assert.equal(r.json.places[0].en, 'Talat Noi Old Noodle House');

    // 5. Test Public Spotlight API: /api/places/spotlight
    r = await request(base, '/api/places/spotlight');
    assert.equal(r.status, 200);
    assert.equal(r.json.count, 1);
    assert.equal(r.json.spotlight[0].spotlightBadge, 'Local Pick');

    // 6. Test Nearby with localOnly filter
    // Search around Talat Noi (13.734, 100.513) within 5 km
    r = await request(base, '/api/places/nearby?lat=13.734&lon=100.513&radiusKm=5&localOnly=1');
    assert.equal(r.status, 200);
    assert.equal(r.json.localOnly, true);
    assert.equal(r.json.places.length, 1);
    assert.equal(r.json.places[0].isSme, true);

    // 7. Register Tourist User
    r = await request(base, '/api/auth/register', {
      method: 'POST',
      origin: base,
      body: { name: 'Somchai Traveler', email: 'somchai@travel.th', password: 'SomchaiPassword2026!' }
    });
    assert.equal(r.status, 201);
    const userCookie = r.cookie;

    // 8. Submit Travel Safety Report (Overcharging Taxi near Sukhumvit)
    r = await request(base, '/api/safety/reports', {
      method: 'POST',
      cookie: userCookie,
      origin: base,
      body: {
        category: 'overcharging',
        title: 'Taxi refused meter and charged 500 THB flat rate',
        description: 'Tuk-Tuk and Taxi drivers at BTS Asok exit refused to turn on meter and quoted 500 baht for 2 km trip.',
        locationName: 'BTS Asok / Sukhumvit Rd, Bangkok',
        lat: 13.737,
        lon: 100.560
      }
    });
    assert.equal(r.status, 201);
    assert.equal(r.json.report.status, 'pending');
    const safetyReportId = r.json.report.id;

    // 9. Verify Public Safety API: Pending report must NOT be visible to public
    r = await request(base, '/api/safety/reports');
    assert.equal(r.status, 200);
    assert.equal(r.json.count, 0, 'Pending safety report must not be public');

    // User can see own report in /api/me/safety-reports
    r = await request(base, '/api/me/safety-reports', { cookie: userCookie });
    assert.equal(r.status, 200);
    assert.equal(r.json.reports.length, 1);
    assert.equal(r.json.reports[0].status, 'pending');

    // 10. Admin moderates safety report
    r = await request(base, '/api/admin/safety-reports', { cookie: adminCookie });
    assert.equal(r.status, 200);
    assert.equal(r.json.reports.length, 1);
    assert.equal(r.json.reports[0].id, safetyReportId);

    // Approve as verified
    r = await request(base, `/api/admin/safety-reports/${safetyReportId}`, {
      method: 'PATCH',
      cookie: adminCookie,
      origin: base,
      body: { status: 'verified', adminNote: 'Verified based on multiple traveler reports in this area.' }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.status, 'verified');

    // 11. Now verified report MUST appear on public /api/safety/reports for map markers
    r = await request(base, '/api/safety/reports');
    assert.equal(r.status, 200);
    assert.equal(r.json.count, 1);
    assert.equal(r.json.reports[0].id, safetyReportId);
    assert.equal(r.json.reports[0].category, 'overcharging');
    assert.equal(r.json.reports[0].locationName, 'BTS Asok / Sukhumvit Rd, Bangkok');

    // 12. Admin Stats API
    r = await request(base, '/api/admin/stats', { cookie: adminCookie });
    assert.equal(r.status, 200);
    const stats = r.json.stats;
    assert.equal(stats.totalUsers, 1);
    assert.equal(stats.totalPlaces, 2);
    assert.equal(stats.publishedPlaces, 2);
    assert.equal(stats.smePlaces, 1);
    assert.equal(stats.verifiedSafetyReports, 1);
    assert.equal(stats.pendingSafetyReports, 0);

    // 13. Estimate Transportation & Taxi Cost API (Section 1.2 & 1.5)
    r = await request(base, '/api/trips/estimate-cost?distanceKm=12');
    assert.equal(r.status, 200);
    assert.equal(r.json.distanceKm, 12);
    assert.ok(r.json.taxiFare.min > 90);
    assert.ok(r.json.fuelCost.min > 30);

    // 14. Recommend Local SME Stopovers along waypoints (Section 1.5 & W7)
    // Waypoint: 'grand-temple' (at 13.750, 100.490) -> SME: 'talat-noi-old-noodle-house' (at 13.734, 100.513, ~3km detour)
    r = await request(base, '/api/trips/recommend-sme', {
      method: 'POST',
      body: { places: ['grand-temple'], maxDetourKm: 10 }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.count, 1);
    assert.equal(r.json.recommendations[0].place.id, 'talat-noi-old-noodle-house');
    assert.ok(r.json.recommendations[0].detourKm <= 5);

    // 15. Create Itinerary with Budget Breakdown (Section 1.5)
    r = await request(base, '/api/me/itineraries', {
      method: 'POST',
      cookie: userCookie,
      origin: base,
      body: {
        title: 'Cultural Old Town & Local Bites',
        days: 1,
        hoursPerDay: 6,
        currency: 'THB',
        travelMode: 'driving',
        budget: 5000,
        groups: [['grand-temple']],
        budgetBreakdown: { transport: 500, fuel: 300, food: 1200, activities: 500 }
      }
    });
    assert.equal(r.status, 201);
    const itineraryId = r.json.itinerary.id;
    assert.equal(r.json.itinerary.budgetBreakdown.food, 1200);

    // 16. Add Recommended SME Stop into Day 1 of Trip
    r = await request(base, `/api/me/itineraries/${itineraryId}/add-stop`, {
      method: 'POST',
      cookie: userCookie,
      origin: base,
      body: { dayIndex: 0, placeSlug: 'talat-noi-old-noodle-house' }
    });
    assert.equal(r.status, 200);
    assert.deepEqual(r.json.itinerary.groups[0], ['grand-temple', 'talat-noi-old-noodle-house']);

    // 17. Populated Collections API
    await request(base, '/api/me/collections', {
      method: 'PUT',
      cookie: userCookie,
      origin: base,
      body: { saved: ['talat-noi-old-noodle-house'], trip: ['grand-temple'] }
    });
    r = await request(base, '/api/me/collections?populated=1', { cookie: userCookie });
    assert.equal(r.status, 200);
    assert.equal(r.json.savedPlaces.length, 1);
    assert.equal(r.json.savedPlaces[0].id, 'talat-noi-old-noodle-house');
    assert.equal(r.json.tripPlaces[0].id, 'grand-temple');

    // 18. AI Travel Advisor: Auto Trip Planning (Section 1.1 & 1.5)
    r = await request(base, '/api/ai/advisor', {
      method: 'POST',
      body: {
        destination: 'bangkok',
        days: 1,
        budget: 3000,
        travelers: 2,
        interests: ['culture', 'food'],
        travelMode: 'driving',
        pace: 'relaxed',
        includeSme: true
      }
    });
    assert.equal(r.status, 200);
    const aiPlan = r.json.plan;
    assert.equal(aiPlan.type, 'auto_trip_plan');
    assert.equal(aiPlan.days, 1);
    assert.ok(aiPlan.totalDistanceKm >= 0);
    assert.equal(aiPlan.dailyItinerary.length, 1);
    assert.ok(aiPlan.dailyItinerary[0].places.length >= 1);
    assert.ok(aiPlan.budgetBreakdown.totalEstimated > 0);
    assert.ok(aiPlan.aiSummary.length > 20);
    assert.ok(Array.isArray(aiPlan.groups));

    // 19. AI Travel Advisor: Quick Walking / Near-Me query
    r = await request(base, '/api/ai/advisor', {
      method: 'POST',
      body: {
        userLat: 13.734,
        userLon: 100.513,
        query: 'มีร้านอาหาร local อร่อยๆ ในระยะเดิน 10 นาทีไหม'
      }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.plan.type, 'quick_walk_recommendations');
    assert.ok(r.json.plan.places.length >= 1);
    assert.equal(r.json.plan.places[0].id, 'talat-noi-old-noodle-house');
    assert.ok(r.json.plan.places[0].walkingDistanceMeters <= 500);
    assert.ok(r.json.plan.places[0].estimatedWalkMinutes <= 10);

    // 20. Analytics & SME Events Tracking (Section 1.7, 2.7, 2.9)
    r = await request(base, '/api/analytics/event', {
      method: 'POST',
      origin: base,
      body: { placeSlug: 'talat-noi-old-noodle-house', eventType: 'view' }
    });
    assert.equal(r.status, 200);
    await request(base, '/api/analytics/event', {
      method: 'POST',
      origin: base,
      body: { placeSlug: 'talat-noi-old-noodle-house', eventType: 'direction' }
    });
    await request(base, '/api/analytics/event', {
      method: 'POST',
      origin: base,
      body: { placeSlug: 'talat-noi-old-noodle-house', eventType: 'sme_impression' }
    });

    // Verify Admin SME Stats
    r = await request(base, '/api/admin/sme-stats', { cookie: adminCookie });
    assert.equal(r.status, 200);
    assert.ok(r.json.smeStats.length >= 1);
    const noodleStats = r.json.smeStats.find(s => s.slug === 'talat-noi-old-noodle-house');
    assert.ok(noodleStats);
    assert.equal(noodleStats.views, 1);
    assert.equal(noodleStats.directions, 1);
    assert.equal(noodleStats.impressions, 1);

    // 21. Spotlight & Campaign Management (Section 1.7, 2.2, 2.9)
    r = await request(base, '/api/admin/campaigns', {
      method: 'POST',
      cookie: adminCookie,
      origin: base,
      body: {
        title: 'เทศกาลอาหารเยาวราช & ตลาดน้อย',
        subtitle: 'ชิมสตรีตฟู้ดในตำนานและร้าน SME ท้องถิ่น',
        category: 'food',
        region: 'central',
        badge: 'Local Pick',
        targetPlaceSlug: 'talat-noi-old-noodle-house',
        status: 'published',
        priority: 10
      }
    });
    assert.equal(r.status, 201);
    const campaignId = r.json.campaign.id;

    // Public campaigns
    r = await request(base, '/api/campaigns');
    assert.equal(r.status, 200);
    assert.equal(r.json.campaigns.length, 1);
    assert.equal(r.json.campaigns[0].title, 'เทศกาลอาหารเยาวราช & ตลาดน้อย');

    // Admin updates campaign
    r = await request(base, `/api/admin/campaigns/${campaignId}`, {
      method: 'PUT',
      cookie: adminCookie,
      origin: base,
      body: {
        title: 'เทศกาลอาหารเยาวราช & ตลาดน้อย 2026',
        status: 'published',
        priority: 15
      }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.campaign.title, 'เทศกาลอาหารเยาวราช & ตลาดน้อย 2026');

    // 22. Admin User Management (Section 2.4)
    r = await request(base, '/api/admin/users', { cookie: adminCookie });
    assert.equal(r.status, 200);
    assert.equal(r.json.users.length, 1);
    const managedUser = r.json.users[0];
    assert.equal(managedUser.email, 'somchai@travel.th');
    assert.equal(managedUser.itineraryCount, 1);
    assert.equal(managedUser.safetyReportCount, 1);
    assert.equal(managedUser.status, 'active');

    // Admin suspends user
    r = await request(base, `/api/admin/users/${managedUser.id}/status`, {
      method: 'PATCH',
      cookie: adminCookie,
      origin: base,
      body: { status: 'suspended', note: 'Policy violation test' }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.status, 'suspended');

    // Suspended user gets 403 on protected route
    r = await request(base, '/api/me/profile', {
      method: 'PATCH',
      cookie: userCookie,
      origin: base,
      body: { name: 'Attempted Change' }
    });
    assert.equal(r.status, 403);

    // Admin reactivates user
    r = await request(base, `/api/admin/users/${managedUser.id}/status`, {
      method: 'PATCH',
      cookie: adminCookie,
      origin: base,
      body: { status: 'active' }
    });
    assert.equal(r.status, 200);

    // Re-login user to get fresh session
    r = await request(base, '/api/auth/login', {
      method: 'POST',
      origin: base,
      body: { email: 'somchai@travel.th', password: 'SomchaiPassword2026!' }
    });
    assert.equal(r.status, 200);
    const activeCookie = r.cookie;

    // 22b. Filtered Places Queries (Backend Enhancement for Frontend)
    r = await request(base, '/api/places?q=grand');
    assert.equal(r.status, 200);
    assert.ok(r.json.places.some(p => p.id === 'grand-temple'));

    // 22c. Recommend SME with stops coordinates and stopovers response
    r = await request(base, '/api/trips/recommend-sme', {
      method: 'POST',
      body: { stops: [{ lat: 13.750, lon: 100.490 }], maxDetourKm: 10 }
    });
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.json.stopovers));
    assert.equal(r.json.stopovers[0].place.id, 'talat-noi-old-noodle-house');

    // 22d. Alias /api/itineraries endpoint for Frontend Planner
    r = await request(base, '/api/itineraries', {
      method: 'POST',
      cookie: activeCookie,
      origin: base,
      body: {
        title: 'Trip via alias',
        days: 1,
        hoursPerDay: 6,
        currency: 'THB',
        travelMode: 'driving',
        groups: [['grand-temple']]
      }
    });
    assert.equal(r.status, 201);
    assert.equal(r.json.itinerary.title, 'Trip via alias');

    // 22e. Custom User Collection Folders (/api/me/folders)
    r = await request(base, '/api/me/folders', {
      method: 'POST',
      cookie: activeCookie,
      origin: base,
      body: { name: 'วัดและโบราณสถาน', color: '#10B981', icon: '🛕' }
    });
    assert.equal(r.status, 201);
    const folderId = r.json.folder.id;
    assert.equal(r.json.folder.name, 'วัดและโบราณสถาน');

    // Add place to folder
    r = await request(base, `/api/me/folders/${folderId}/places`, {
      method: 'POST',
      cookie: activeCookie,
      origin: base,
      body: { placeId: 'grand-temple' }
    });
    assert.equal(r.status, 200);

    // List places in folder
    r = await request(base, `/api/me/folders/${folderId}/places`, {
      cookie: activeCookie
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.places.length, 1);
    assert.equal(r.json.places[0].id, 'grand-temple');

    // Delete place from folder
    r = await request(base, `/api/me/folders/${folderId}/places/grand-temple`, {
      method: 'DELETE',
      cookie: activeCookie,
      origin: base
    });
    assert.equal(r.status, 200);

    // Delete folder
    r = await request(base, `/api/me/folders/${folderId}`, {
      method: 'DELETE',
      cookie: activeCookie,
      origin: base
    });
    assert.equal(r.status, 200);

    // 23. User Account Erasure / PDPA Self-Deletion (Section 1.6)
    r = await request(base, '/api/me/account', {
      method: 'DELETE',
      cookie: activeCookie,
      origin: base,
      body: { password: 'SomchaiPassword2026!' }
    });
    assert.equal(r.status, 200);
    assert.equal(r.json.ok, true);

    // Account should now be gone
    r = await request(base, '/api/auth/me', { cookie: activeCookie });
    assert.equal(r.status, 200);
    assert.equal(r.json.user, null);

  } finally {
    if (run?.proc && run.proc.exitCode === null) {
      run.proc.kill();
      await new Promise(res => run.proc.once('exit', res));
    }
    fs.rmSync(tmp, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
});
