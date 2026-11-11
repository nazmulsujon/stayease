# StayEase: Online Reservation and Booking System

An online hotel room reservation system. Guests check live availability and book
rooms in minutes. Administrators manage rooms, bookings, payments, customers and reviews.

- 📄 Requirements and design: [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) (single source of truth)
- ✅ Tests and requirement traceability: [`docs/TESTING.md`](docs/TESTING.md)

## Features

- **Guests:**
  - live availability search
  - room catalogue with photos, filters and ratings
  - registration and login
- **Customers:**
  - booking with server-side pricing and automatic room assignment
  - My bookings (upcoming / past / cancelled)
  - cancellation
  - reviews after a completed stay
  - profile and password change
- **Administrators:**
  - dashboard (occupancy, revenue, arrivals and departures)
  - booking management (confirm, cancel, complete, payment)
  - room types and rooms
  - customer blocking
  - review moderation
- **No double bookings:** every booking runs in a MongoDB transaction with a room-level lock (see plan §12.5).

## Tech Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (Radix) ·
Lucide icons · MongoDB + Mongoose · Zod · React Hook Form · JWT (jose) ·
bcryptjs · Vitest

## Getting Started

**Requirements:** Node.js 22 or newer.

```bash
npm install
cp .env.example .env.local      # then fill in the values
```

### Database

Booking uses MongoDB **transactions**, which need a **replica set**. Choose one option:

- **Local (no installation needed):** run `npm run db:local` in a separate terminal and keep it running. Then set
  `MONGODB_URI=mongodb://127.0.0.1:27018/?replicaSet=rs0&directConnection=true`.
  Data is stored in `.mongo-data/`. Stop it with **Ctrl+C**.
- **MongoDB Atlas (for deployment):** create a free M0 cluster and paste its `mongodb+srv://…` connection string.

Generate a `JWT_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Check the connection:

```bash
npm run db:check
```

### Admin account

Admins cannot sign up publicly. Set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PHONE` and
`ADMIN_PASSWORD` in `.env.local`, then run:

```bash
npm run seed:admin
```

Log in at `/login` with those credentials and you will be taken to `/admin`.
To set a new admin password later, run `npm run seed:admin -- --reset-password`.

### Demo data (optional)

Set `DEMO_CUSTOMER_PASSWORD` in `.env.local`, then load 6 room types with photos,
23 rooms, 5 demo customers (`…@demo.stayease.test`), 20 bookings in every status and 7 reviews:

```bash
npm run seed:demo -- --reset
```

⚠️ `--reset` deletes all room types, rooms, bookings, reviews and customer accounts first.
Administrator accounts are kept.

### Run

```bash
npm run dev          # http://localhost:3000
```

Health check: <http://localhost:3000/api/health> returns `transactionsSupported: true`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build / run |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript type check |
| `npm test` | Automated tests (in-memory MongoDB replica set) |
| `npm run db:local` | Start the local MongoDB replica set |
| `npm run db:check` | Verify the database in `.env.local` is reachable and supports transactions |
| `npm run seed:admin` | Create the administrator account from `ADMIN_*` settings |
| `npm run seed:demo` | Load demo room types, rooms, customers, bookings and reviews |

## Folder Structure

```
src/
  proxy.ts             Optimistic route protection (Next.js 16 "middleware")
  actions/             Server Actions (form submissions)
  app/                 Routes (App Router)
    (site)/            Public & customer pages (shared header/footer)
    (auth)/            Login and registration
    admin/             Admin area (role-protected)
    api/               Route Handlers (REST endpoints)
  components/
    ui/                shadcn/ui primitives (generated, do not edit heavily)
    layout/            Header, footer, navigation
    admin/             Admin forms, tables and controls
    auth/              Login and registration forms
    forms/             Shared form helpers (error alert, server error mapping)
    booking/           Search form, booking flow, booking cards
    landing/           Landing page motion (scroll reveal)
    profile/           Profile and password forms
    reviews/           Star ratings, review list and form
    rooms/             Public room cards and images
    shared/            Reusable app components (Container, PageHeader, EmptyState…)
  config/              Non-secret site configuration
  lib/                 Core utilities: env validation, DB connection, formatting
    auth/              Passwords, JWT, session cookie, Data Access Layer, redirects
  models/              Mongoose models
  services/            Business logic: auth, catalogue, availability, booking, admin, reviews, profile
  validations/         Zod schemas shared by forms and Server Actions
  types/               Shared TypeScript types
  hooks/               Reusable React hooks
scripts/               CLI scripts (local DB, DB check, seeding)
tests/                 Vitest test suites
docs/                  Project documentation
```

## Development Phases

1. ✅ Setup · 2. ✅ Authentication · 3. ✅ Room Catalogue · 4. ✅ Availability & Booking ·
5. ✅ Admin Management · 6. ✅ Reviews & Polish · 7. ✅ Testing & Documentation
