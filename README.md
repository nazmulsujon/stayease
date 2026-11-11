# StayEase: Online Reservation and Booking System

A hotel room reservation system built as an undergraduate CSE project.
Customers can check live availability and book rooms. Administrators manage
rooms, bookings, payments and users.

📄 **Requirements and design:** [`docs/PROJECT_PLAN.md`](docs/PROJECT_PLAN.md) is the single source of truth.

## Tech Stack

Next.js 16 (App Router) · TypeScript · Tailwind CSS 4 · shadcn/ui (Radix) ·
Lucide icons · MongoDB + Mongoose · Zod · React Hook Form · JWT (jose) ·
bcryptjs · date-fns · Vitest

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

## Folder Structure

```
src/
  app/                 Routes (App Router)
    (site)/            Public & customer pages (shared header/footer)
    api/               Route Handlers (REST endpoints)
  components/
    ui/                shadcn/ui primitives (generated, do not edit heavily)
    layout/            Header, footer, navigation
    shared/            Reusable app components (Container, PageHeader, EmptyState…)
  config/              Non-secret site configuration
  lib/                 Core utilities: env validation, DB connection, formatting
  models/              Mongoose models               (Phase 2+)
  services/            Business logic, e.g. availability & booking (Phase 3+)
  validations/         Zod schemas shared by forms and API (Phase 2+)
  types/               Shared TypeScript types
  hooks/               Reusable React hooks
scripts/               CLI scripts (local DB, DB check, seeding)
tests/                 Vitest test suites
docs/                  Project documentation
```

## Development Phases

1. ✅ Setup · 2. Authentication · 3. Room Catalogue · 4. Availability & Booking ·
5. Admin Management · 6. Reviews & Polish · 7. Testing & Documentation
