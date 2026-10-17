# unfold v2.7 — Functional Readiness

Local first-party travel discovery web app with Node.js 22.16+/24+, SQLite, Admin Studio, Business Portal/Owner, Traveler accounts/reviews and trip planning.

This upgrade adds an authenticated Admin Audit Log, privacy-aware unpublished media, SHA-256 verified backup and offline restore with dry-run, a non-destructive database doctor, single-process data lock, and a genuine HTTP cross-role lifecycle test. It preserves the accepted v2.6 UI and adds data structures without wiping existing SQLite tables.

**Local development software, not production-ready.** No native APK/IPA, payment, booking revenue, real routing provider, externally accessible HTTPS, or assured email delivery. Read `README-TH.md` for Windows instructions and `FUNCTIONAL-READINESS.md` for feature acceptance rules.

Run `START-WINDOWS.cmd` on Windows with Node.js 24 LTS, `npm test` for automated tests, and `npm run doctor` to check a created local database. `BACKUP-WINDOWS.cmd` creates a verified snapshot. `RESTORE-WINDOWS.cmd` validates and explicitly confirms restore while the server is stopped.

Local endpoints: `/`, `/planner.html`, `/admin.html`, `/business.html`, `/business-admin.html`, `/moderation.html`, `/audit.html`.

Only auto-generated `manifest.json` snapshots from v2.7+ are supported by the automated restore. Backups from earlier versions need a separate import procedure.
