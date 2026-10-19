# unfold — Functional Acceptance Matrix (v2.7)

**Goal:** Features must execute a real API → validated data → SQLite persistence → authorized output. A visual mockup does not count as complete. Automated development tests take place BEFORE any real-user field trial.

| Capability | Current evidence | Limitations / remaining acceptance |
|---|---|---|
| Admin place CRUD and publishing | Real HTTP + SQLite tests PASS | Test Windows and large/photo-heavy lists; deletion is permanent and needs a recoverable Archive workflow |
| Owner applications and ownership claims | Real HTTP role-isolation tests PASS | Only one business per owner, no staff invites / branch role scopes |
| Public visibility & moderated reviews | Full create → approve → public GET lifecycle PASS | Abuse/report/appeals workflow still limited |
| Traveler Saved / My Trips | Real server/account persistence tests PASS | Device-to-device sync only after shared-host deployment |
| Trip Planner | Persistence and isolation tests PASS | Approximate distances only; no accurate travel-time/opening-hour feasibility |
| Admin Activity Log | Authorized retrieval and event coverage PASS | Tracks new API events only; not guaranteed against DB edits by local machine administrators |
| Media privacy | Unpublished Admin/Owner picture blocked and protected previews PASS | Audit of other user-uploaded media/privacy still advisable |
| DB backup/restore | SHA-256 manifest, dry-run, safety snapshot, rollback and corruption rejection test PASS | Need Windows-specific filesystem/permission testing; backups are not encrypted or authenticated against malicious replacement |
| Health Check | SQLite integrity, FK and referenced-file checks PASS | Not a full load/observability/production monitor |
| Email verify/reset | One-time token test PASS in dev-console delivery | Production provider + domain configuration and Inbox delivery NOT TESTED |
| GPS, actual routing | GPS filtering with simulated coordinates PASS | Hardware location and road routing NOT TESTED |
| Host/OS compatibility | Tests run with Node in Linux | Windows `START-WINDOWS.cmd` and restore permission cases NOT TESTED |
| Public launch | Local server only | HTTPS hosting, rate-limit infrastructure, security review and privacy compliance NOT READY |
| Booking / payment / revenue | No fake business figures used | Not built; intentionally deferred |
| Native mobile app | Responsive web UI | APK/iOS builds intentionally deferred |

## Next required development before handing over for real user trial

1. **Complete Backend operating features:** multi-business accounts + Owner/Manager/Staff RBAC; business-level audit trail; safe Archive/Restore instead of destructive deletion.
2. **Complete security & account lifecycle:** MFA for Admin, logout-all devices, email provider with Inbox tests, password/account recovery, delete/export account, upload quotas and abuse prevention.
3. **Complete admin operations:** duplicate place detection, review reports/appeals, stale data/closed locations, bulk edit/import/export, monitoring/log retention.
4. **Complete data durability:** encrypted off-machine backups, scheduled backup and restoration drills, migrations under real existing datasets, concurrency/load testing.
5. **Complete navigation accuracy:** real map/geocoding/route provider, opening hours, weather/trail closure, time estimate and clear data freshness.
6. **End-to-end release checklist:** automated test fixtures, browser testing through a real Windows HTTP server, Android/iOS browser performance, accessibility, permission adversarial tests, incident recovery plan.

**The v2.7 ZIP is an engineering increment, not final launch acceptance.**
