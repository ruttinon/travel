'use strict';

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY CHECK(id=1), salt TEXT NOT NULL, password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY, expires_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS places (
      slug TEXT PRIMARY KEY, name_en TEXT NOT NULL, name_th TEXT NOT NULL DEFAULT '',
      location_en TEXT NOT NULL, location_th TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL, region TEXT NOT NULL, lat REAL, lon REAL,
      visit TEXT NOT NULL DEFAULT '', description_en TEXT NOT NULL DEFAULT '',
      description_th TEXT NOT NULL DEFAULT '', cover TEXT NOT NULL DEFAULT '',
      gallery_json TEXT NOT NULL DEFAULT '[]', featured INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'draft', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS places_status_updated ON places(status, featured, updated_at);
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      salt TEXT NOT NULL, password_hash TEXT NOT NULL, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS user_sessions (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS user_sessions_user ON user_sessions(user_id);
    CREATE TABLE IF NOT EXISTS user_collections (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      place_slug TEXT NOT NULL REFERENCES places(slug) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('saved','trip')),
      position INTEGER NOT NULL,
      PRIMARY KEY (user_id,place_slug,kind)
    );
    CREATE TABLE IF NOT EXISTS review_media (
      filename TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      place_slug TEXT NOT NULL REFERENCES places(slug) ON DELETE CASCADE,
      stars INTEGER NOT NULL CHECK(stars BETWEEN 1 AND 5),
      text TEXT NOT NULL, photo TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')) DEFAULT 'pending',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, moderated_at TEXT,
      UNIQUE(user_id,place_slug)
    );
    CREATE INDEX IF NOT EXISTS reviews_place_status ON reviews(place_slug,status,updated_at);
    CREATE TABLE IF NOT EXISTS account_tokens (
      token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      purpose TEXT NOT NULL CHECK(purpose IN ('verify','reset')),
      expires_at INTEGER NOT NULL, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS account_tokens_lookup ON account_tokens(user_id,purpose);
  `);

  function addColumn(table, column, definition) {
    const names = db.prepare(`PRAGMA table_info(${table})`).all().map(r => r.name);
    if (!names.includes(column)) {
      db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }

  // Additive migrations keep all existing v2.1/v2.2 content and accounts.
  addColumn('users', 'email_verified', 'INTEGER NOT NULL DEFAULT 1');
  addColumn('places', 'price_from', 'REAL');
  addColumn('places', 'price_currency', "TEXT NOT NULL DEFAULT 'THB'");
  addColumn('places', 'is_sme', 'INTEGER NOT NULL DEFAULT 0');
  addColumn('places', 'sme_type', "TEXT NOT NULL DEFAULT ''");
  addColumn('places', 'spotlight_badge', "TEXT NOT NULL DEFAULT ''");
  addColumn('places', 'local_story_th', "TEXT NOT NULL DEFAULT ''");
  addColumn('places', 'local_story_en', "TEXT NOT NULL DEFAULT ''");
  addColumn('places', 'contact_phone', "TEXT NOT NULL DEFAULT ''");
  addColumn('places', 'contact_website', "TEXT NOT NULL DEFAULT ''");
  addColumn('places', 'contact_line', "TEXT NOT NULL DEFAULT ''");
  addColumn('places', 'opening_hours_json', "TEXT NOT NULL DEFAULT '{}'");
  addColumn('places', 'google_place_id', "TEXT NOT NULL DEFAULT ''");
  addColumn('places', 'is_sponsored', 'INTEGER NOT NULL DEFAULT 0');
  addColumn('users', 'status', "TEXT NOT NULL DEFAULT 'active'");

  db.exec(`
    CREATE TABLE IF NOT EXISTS travel_safety_reports (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      category TEXT NOT NULL CHECK (category IN ('overcharging','transport','scam','danger','other')),
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      location_name TEXT NOT NULL,
      lat REAL NOT NULL,
      lon REAL NOT NULL,
      photo TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL CHECK (status IN ('pending','verified','rejected','resolved')) DEFAULT 'pending',
      admin_note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS travel_safety_status ON travel_safety_reports(status, updated_at DESC);
    CREATE TABLE IF NOT EXISTS safety_media (
      filename TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      banner_url TEXT NOT NULL DEFAULT '',
      target_place_slug TEXT,
      target_url TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      region TEXT NOT NULL DEFAULT '',
      badge TEXT NOT NULL DEFAULT '',
      start_date TEXT,
      end_date TEXT,
      status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('draft','published','expired')),
      priority INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS campaigns_status_priority ON campaigns(status, priority DESC, updated_at DESC);
    CREATE TABLE IF NOT EXISTS place_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      place_slug TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK(event_type IN ('view','direction','phone','website','favorite','add_trip','sme_impression')),
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS place_events_slug_type ON place_events(place_slug, event_type);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY, owner_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL, type TEXT NOT NULL, contact_email TEXT NOT NULL,
      phone TEXT NOT NULL DEFAULT '', website TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected','suspended')),
      admin_note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS place_owners (
      place_slug TEXT PRIMARY KEY REFERENCES places(slug) ON DELETE CASCADE,
      business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      attached_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS place_owners_business ON place_owners(business_id);
    CREATE TABLE IF NOT EXISTS business_media (
      filename TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS business_submissions (
      id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
      action TEXT NOT NULL CHECK (action IN ('create','edit','claim')),
      place_slug TEXT, payload_json TEXT NOT NULL DEFAULT '{}',
      evidence TEXT NOT NULL DEFAULT '', base_updated_at TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','pending','approved','rejected')),
      admin_note TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      reviewed_at TEXT
    );
    CREATE INDEX IF NOT EXISTS business_submissions_status ON business_submissions(status,updated_at);
    CREATE INDEX IF NOT EXISTS business_submissions_business ON business_submissions(business_id,updated_at);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_itineraries (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      days INTEGER NOT NULL CHECK(days BETWEEN 1 AND 7),
      hours_per_day INTEGER NOT NULL CHECK(hours_per_day BETWEEN 2 AND 12),
      currency TEXT NOT NULL,
      budget REAL,
      travel_mode TEXT NOT NULL CHECK(travel_mode IN ('driving','walking','transit')),
      days_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS itinerary_by_user ON user_itineraries(user_id,updated_at);
  `);
  addColumn('user_itineraries', 'budget_breakdown_json', "TEXT NOT NULL DEFAULT '{}'");

  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      occurred_at TEXT NOT NULL,
      actor_type TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      context_json TEXT NOT NULL DEFAULT '{}'
    );
    CREATE INDEX IF NOT EXISTS audit_events_by_date ON audit_events(id DESC);
    CREATE INDEX IF NOT EXISTS audit_events_entity ON audit_events(entity_type,entity_id,id DESC);
  `);
}

module.exports = { initSchema };
