# StayEase: Testing and Requirement Traceability

## How to run the tests

```bash
npm test            # 159 automated tests (Vitest + in-memory MongoDB replica set)
npm run typecheck   # TypeScript
npm run lint        # ESLint
npm run build       # production build
```

The database tests start a real, throw-away MongoDB **replica set** in memory.
They run against the real Mongoose models and services, including transactions.

| Test file | Area |
|---|---|
| `tests/env.test.ts` | Environment validation |
| `tests/db.test.ts` | Connection, transactions, rollback, write-conflict locking |
| `tests/auth-validation.test.ts` | Registration and login input rules |
| `tests/auth-token.test.ts` | JWT signing and verification |
| `tests/auth-routing.test.ts` | Route protection and safe redirects |
| `tests/auth-service.test.ts` | Registration, login, blocked users, session lookup |
| `tests/catalogue-validation.test.ts` | Room type / room input rules, slugs |
| `tests/catalogue-service.test.ts` | Room catalogue service |
| `tests/booking-validation.test.ts` | Date rules, time zone, reference codes |
| `tests/booking-service.test.ts` | Availability, booking transaction, **concurrency**, cancellation, FR-ADM-04 |
| `tests/admin-review-profile.test.ts` | Admin management, dashboard, users, reviews, filters, profile |

## Requirement traceability

**A** = automated test, **M** = manual browser test (Chrome, desktop 1280 px and mobile 375 px).

| ID | Requirement (short) | Verified by |
|---|---|---|
| FR-AUTH-01 | Register | A: auth-validation, auth-service · M |
| FR-AUTH-02 | Duplicate email rejected | A: auth-service (incl. simultaneous) · M |
| FR-AUTH-03 | bcrypt hashing, hash never returned | A: auth-service |
| FR-AUTH-04 | Login | A: auth-service · M |
| FR-AUTH-05 | HttpOnly JWT session cookie | A: auth-token · M (cookie not readable by JS) |
| FR-AUTH-06 | Logout | M (desktop and mobile menus) |
| FR-AUTH-07 | Role-based access (proxy + DAL) | A: auth-routing, auth-service · M |
| FR-AUTH-08 | Blocked users cannot log in | A: auth-service, admin-review-profile · M |
| FR-AUTH-09 | Edit profile, change password | A: admin-review-profile · M |
| FR-ROOM-01 | List active room types | A: catalogue-service · M |
| FR-ROOM-02 | Room type details | A: catalogue-service · M |
| FR-ROOM-03 | Price / capacity filters | A: admin-review-profile · M |
| FR-AVAIL-01 | Search by dates and guests | A: booking-service · M |
| FR-AVAIL-02 | Date validation, frontend + backend | A: booking-validation · M (form and URL) |
| FR-AVAIL-03 | Max 30 nights | A: booking-validation |
| FR-AVAIL-04 | Available room count per type | A: booking-service · M |
| FR-AVAIL-05 | Pending/confirmed block; cancelled/completed do not | A: booking-service |
| FR-AVAIL-06 | Maintenance/inactive rooms never available | A: booking-service |
| FR-BOOK-01 | Customers only | A: auth-routing · M |
| FR-BOOK-02 | Summary before confirmation | M |
| FR-BOOK-03 | Server-side price | A: booking-service, booking-validation |
| FR-BOOK-04 | Automatic room assignment | A: booking-service |
| FR-BOOK-05 | Transaction + room-level lock, no double booking | A: db, booking-service (12 concurrent requests; admin-vs-booking race) |
| FR-BOOK-06 | Pending, unpaid, reference code | A: booking-service, booking-validation · M |
| FR-BOOK-07 | Price snapshot | A: booking-service |
| FR-BOOK-08 | My bookings grouped | A: booking-service · M |
| FR-BOOK-09 | Customer cancellation rules | A: booking-service · M |
| FR-BOOK-10 | Special request | A: booking-validation · M |
| FR-REV-01 | Review only after completed stay | A: admin-review-profile · M |
| FR-REV-02 | Rating 1–5 + comment, one per booking | A: admin-review-profile · M |
| FR-REV-03 | Average rating and list | A: admin-review-profile · M |
| FR-REV-04 | Admin hide/delete | A: admin-review-profile · M |
| FR-ADM-01 | Dashboard statistics | A: admin-review-profile · M |
| FR-ADM-02 | Room type CRUD + deactivate | A: catalogue-service · M |
| FR-ADM-03 | Room CRUD + status | A: catalogue-service · M |
| FR-ADM-04 | No deletes; guards while bookings exist | A: booking-service |
| FR-ADM-05 | Booking search and filters | A: admin-review-profile · M |
| FR-ADM-06 | Status transitions | A: admin-review-profile · M |
| FR-ADM-07 | Payment status, admin only | A: admin-review-profile · M |
| FR-ADM-08 | Block/unblock customers | A: admin-review-profile · M |
| FR-ADM-09 | Review moderation | A: admin-review-profile · M |

## Manual test script (for the demonstration)

Before the demo, prepare the database:

```bash
npm run db:local                 # terminal 1 (or use MongoDB Atlas)
npm run seed:admin
npm run seed:demo -- --reset
npm run dev                      # terminal 2
```

1. **Home page:** hero, search, featured rooms with ratings, facilities, reviews, location. Resize to mobile.
2. **Search:**
   - Pick a check-in date in the past: an error is shown.
   - Search valid dates: room types appear with "N rooms left" and total prices.
3. **Booking as a guest:**
   - Click **Book now**. You are sent to login.
   - Log in as a demo customer. You return to the summary with the same dates.
   - Add a special request and confirm. The confirmation page shows a reference code and status Pending.
4. **My bookings:**
   - Bookings are grouped into Upcoming, Past and Cancelled.
   - Cancel the new booking. It shows "Cancelled by you".
5. **Review:** open a completed past stay, submit a rating and comment, then see it on the room page.
6. **Profile:** change the name or phone, then change the password.
7. **Admin** (log in with the seeded admin):
   - The dashboard shows statistics and today's arrivals and departures.
   - Bookings → filter by *Pending* → open one → **Confirm** → **Mark as paid**.
   - Customers → block a customer. That customer is logged out and cannot log in.
   - Reviews → hide a review. It disappears from the public room page.
   - Rooms → try to put a room with an upcoming booking into maintenance. This is refused with a clear message.
8. **Access control:**
   - As a customer, open `/admin`. You are sent to the home page.
   - As a guest, open `/my-bookings`. You are sent to login.

## Results (11 Nov 2026)

- Automated: **159 / 159 passed**. Typecheck, lint and production build pass.
- Manual: all steps above passed on desktop and mobile widths. No server errors appeared in the development log.
