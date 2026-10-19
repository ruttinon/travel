# unfold v2.7 — Verification (2026-10-16)

**Environment:** Linux container, Node.js v22.16.0, SQLite via `node:sqlite`. Test data is temporary. No actual user data, production email provider, or real booking engine.

| Command / check | Observed result | Classification |
|---|---|---|
| `node --check server.js && node --check audit.js && node --check backup.js && node --check restore.js && node --check doctor.js` | Syntax accepted, exit status 0 | PASS |
| `npm test` | 12 / 12 Node test cases passed; zero failed | PASS |
| `tests/readiness_e2e.test.js` | Real HTTP flow: Admin setup → photo/private draft → Published Place → traveler signup/review → Admin approval → Saved+Trip → itinerary → Owner registration/verify/claim → Admin claim approval → audit | PASS |
| `tests/readiness_e2e.test.js` backup/restore | Live SQLite backup + SHA-256 manifest → restore dry-run → verified apply → image, places, reviews, itineraries, audit rows restored; altered backup image rejected | PASS |
| `tests/readiness_e2e.test.js` auth/media | Audit rejects unprivileged readers, unpublished Admin image rejects public access but Admin preview works, traveler blocked from another owner's business data | PASS |
| `npm run doctor` on restored test DB | DB integrity, FK and referenced image checks completed without errors | PASS |
| Chromium direct navigation to `http://127.0.0.1:5198/audit.html` | `net::ERR_BLOCKED_BY_ADMINISTRATOR` from browser policy | ENVIRONMENT FAIL |
| Native Windows `START-WINDOWS.cmd`, `RESTORE-WINDOWS.cmd` | Linux test environment cannot run Windows scripts | NOT TESTED |
| Live email provider, GPS hardware, HTTPS cloud, booking/payouts, OAuth | External services unavailable or feature not implemented | NOT TESTED |

No claim is made that full production readiness or full human field-test acceptance has been met.
