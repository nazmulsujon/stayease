# Online Reservation and Booking System
## Project Planning and Requirement Analysis Document

| Item | Detail |
|---|---|
| Project Title | Online Reservation and Booking System |
| Booking Domain | Hotel Room Reservation |
| Working Product Name | **StayEase** (fictional hotel) |
| Project Type | Undergraduate CSE Software Development Project |
| Document Version | 1.1 (Approved; updated after Phase 1, see Change Log) |
| Date | 11 November 2026 |

---

## 1. Project Overview

StayEase is a web-based hotel room reservation system for a single hotel. Visitors can browse room categories, check availability for chosen dates, and see prices. Registered customers can book rooms online, view and cancel their reservations, and leave reviews after their stay. Hotel administrators use a separate dashboard to manage rooms, room categories, bookings, payments (recorded manually), and customer accounts.

The system replaces phone calls, walk-in enquiries and paper or spreadsheet registers with one central, always-available platform. It is built as a full-stack web application using Next.js, TypeScript and MongoDB.

**Why one hotel and not a marketplace (like Booking.com)?** A multi-hotel marketplace needs hotel-owner onboarding, commission handling and multi-tenant data separation. That is too much for a semester project. A single-hotel system still covers every core engineering problem: authentication, role-based access, availability calculation, date-overlap conflict detection and administration. It can also be completed and demonstrated in full.

---

## 2. Problem Statement

Many small and medium hotels, especially locally owned ones, still take reservations by phone, Facebook messages or walk-in visits, and record them in paper registers or spreadsheets. This causes several real problems:

1. **Double booking:** The same room is accidentally given to two guests for overlapping dates because there is no single source of truth.
2. **No real-time availability:** Customers cannot see whether a room is free without contacting the hotel. This wastes time for both sides and loses customers outside office hours.
3. **Unclear pricing:** Customers do not know the total cost of a stay in advance.
4. **Poor record keeping:** Booking history, customer details and payment status are scattered and hard to search.
5. **Heavy manual work:** Staff spend a lot of time answering availability questions and updating records by hand.
6. **No management overview:** Owners cannot quickly see today's check-ins, upcoming bookings or revenue.

**Solution statement:** An online reservation system that shows live availability, prevents overlapping bookings automatically, calculates prices instantly, and gives administrators one dashboard to manage all reservations.

---

## 3. Project Objectives

### 3.1 Primary Objectives
1. Build a responsive web application where customers can search room availability by date and book rooms online.
2. Prevent double booking automatically with server-side date-overlap validation.
3. Provide secure registration and login with role-based access (Customer and Administrator).
4. Give administrators a dashboard to manage room categories, rooms, bookings and users.
5. Store all data in a structured, persistent database.

### 3.2 Academic and Learning Objectives
1. Apply the software engineering life cycle: requirement analysis, design, implementation, testing and deployment.
2. Practise full-stack development with a modern, industry-relevant technology stack.
3. Apply database design, data validation and security best practices.

### 3.3 Expected Outcomes
- A working, deployed web application available through a public URL.
- A clean, documented, version-controlled codebase (Git/GitHub).
- A project report with requirements, design diagrams (ERD, use case, workflow) and test results.
- A live demonstration covering the full customer journey and admin operations.

---

## 4. Project Scope

### 4.1 In Scope
- Public website: home page, room listing, room details, availability search.
- User registration, login, logout and profile management.
- Room booking with automatic price calculation and conflict prevention.
- Customer booking history and cancellation.
- Reviews and ratings from customers who completed a stay.
- Admin dashboard with summary statistics.
- Admin management of room types, physical rooms, bookings, payment status and users.
- Responsive design for desktop, tablet and mobile.
- Deployment to a cloud host.

### 4.2 Out of Scope (deliberately excluded)
| Excluded Feature | Reason |
|---|---|
| Real online payment gateway (bKash, SSLCommerz, Stripe) | Needs merchant accounts and business verification. Payments are **recorded manually** by the admin ("Pay at Hotel"). |
| Multiple hotels / hotel-owner accounts | Multi-tenant design is too complex for this scope. |
| Email or SMS notifications | Needs third-party paid services. Planned as a future enhancement. |
| Native mobile app | The responsive web app covers mobile users. |
| Dynamic or seasonal pricing | Fixed price per night per room type keeps the logic clear. |
| Multi-language and multi-currency | Not essential for the demonstration. |

### 4.3 Minimum Viable Project (MVP) Scope

The MVP is the smallest version that is **complete and demonstrable**. It is prioritised with the MoSCoW method:

| Priority | Features |
|---|---|
| **Must Have (MVP)** | Registration and login, role-based access, room type listing and details, availability search by date, booking creation with conflict check, My Bookings page, customer cancellation, admin dashboard (basic stats), admin CRUD for room types and rooms, admin booking management (confirm, cancel, complete, mark paid), admin user list |
| **Should Have** | Reviews and ratings, admin block/unblock users, search filters (price, capacity), booking reference code lookup, profile editing and password change |
| **Could Have** (only if time allows) | Printable booking confirmation page, dashboard charts, dark mode |
| **Won't Have (this version)** | Items listed in Section 4.2 |

---

## 5. Target Users and Roles

| Role | Description | Access Level |
|---|---|---|
| **Guest (Visitor)** | Anyone visiting the website without logging in. | Can browse rooms, view details and reviews, check availability. Cannot book. |
| **Customer (Registered User)** | A person who has registered and logged in. | All guest abilities, plus booking, booking history, cancellation, reviews and profile management. |
| **Administrator** | Hotel staff or manager. Admin accounts are created through a seed script, not by public sign-up. | Full access to the admin dashboard and all management functions. Cannot be blocked from the UI. |

---

## 6. Functional Requirements

Each requirement has an ID for traceability in design, testing and the final report.

### 6.1 Authentication and Account (AUTH)
| ID | Requirement |
|---|---|
| FR-AUTH-01 | The system shall allow a visitor to register with full name, email, phone number and password. |
| FR-AUTH-02 | The system shall reject registration if the email is already in use. |
| FR-AUTH-03 | The system shall store passwords only in hashed form (bcrypt). |
| FR-AUTH-04 | The system shall allow registered users to log in with email and password. |
| FR-AUTH-05 | The system shall keep the user logged in with a secure, HTTP-only session cookie that contains a signed JWT. |
| FR-AUTH-06 | The system shall allow users to log out, which clears the session. |
| FR-AUTH-07 | The system shall restrict pages and API endpoints by role (Customer, Admin). Checks run in the Next.js `proxy.ts` (the Next.js 16 replacement for `middleware.ts`) **and** again inside every server handler. |
| FR-AUTH-08 | The system shall prevent blocked users from logging in. |
| FR-AUTH-09 | The system shall allow a logged-in user to update profile details and change password (current password required). |

### 6.2 Room Catalogue (ROOM)
| ID | Requirement |
|---|---|
| FR-ROOM-01 | The system shall display all active room types with name, image, price per night, capacity and short description. |
| FR-ROOM-02 | The system shall display a room type details page with full description, images, amenities, bed type, size, capacity, price and reviews. |
| FR-ROOM-03 | The system shall allow filtering room types by maximum price and guest capacity. |

### 6.3 Availability and Search (AVAIL)
| ID | Requirement |
|---|---|
| FR-AVAIL-01 | The system shall let users search availability by check-in date, check-out date and number of guests. |
| FR-AVAIL-02 | The system shall validate that check-in is not in the past and check-out is after check-in, on **both** the frontend (form validation, immediate feedback) and the backend (authoritative check on every request). The same Zod schema is shared by both sides. |
| FR-AVAIL-03 | The system shall limit a single stay to a maximum of 30 nights. |
| FR-AVAIL-04 | The system shall show, for each room type, how many rooms are available for the selected dates. |
| FR-AVAIL-05 | A room shall be considered unavailable if it has a booking with status Pending or Confirmed that overlaps the requested dates. Cancelled (and Completed) bookings shall **not** block availability. |
| FR-AVAIL-06 | Rooms with status `maintenance` or `inactive` shall never be counted as available. |

### 6.4 Booking (BOOK)
| ID | Requirement |
|---|---|
| FR-BOOK-01 | The system shall allow only logged-in customers to create bookings. |
| FR-BOOK-02 | The system shall show a booking summary (room type, dates, nights, guests, price per night, total) before confirmation. |
| FR-BOOK-03 | The system shall calculate the total price on the server as `number of nights × price per night`. |
| FR-BOOK-04 | The system shall automatically assign an available physical room of the chosen type. Only rooms with status `available` are eligible; rooms under maintenance or inactive are never assigned. |
| FR-BOOK-05 | The system shall re-check availability on the server at the moment of booking, inside a MongoDB transaction with room-level locking, so that two concurrent requests can never book the same room for overlapping dates (see §12.5). |
| FR-BOOK-06 | The system shall create each booking with status **Pending**, payment status **Unpaid**, and a unique booking reference code (e.g. `SE-7K3P9Q`). |
| FR-BOOK-07 | The system shall store the price per night at booking time, so later price changes do not affect existing bookings. |
| FR-BOOK-08 | The system shall let customers view all their bookings, grouped as Upcoming, Past and Cancelled. |
| FR-BOOK-09 | The system shall let customers cancel a Pending or Confirmed booking before the check-in date. |
| FR-BOOK-10 | The system shall let customers add an optional special request note to a booking. |

### 6.5 Reviews (REV)
| ID | Requirement |
|---|---|
| FR-REV-01 | The system shall allow a customer to review a room type only after one of their bookings for it is Completed. |
| FR-REV-02 | A review shall have a rating (1–5) and a comment. Only one review is allowed per booking. |
| FR-REV-03 | The system shall display the average rating and review list on the room type page. |
| FR-REV-04 | The administrator shall be able to hide or delete inappropriate reviews. |

### 6.6 Administration (ADMIN)
| ID | Requirement |
|---|---|
| FR-ADM-01 | The system shall provide an admin dashboard showing: total bookings, pending bookings, today's check-ins, today's check-outs, current occupancy, total revenue (paid bookings) and registered customers. |
| FR-ADM-02 | The admin shall be able to create, view, update and deactivate room types. |
| FR-ADM-03 | The admin shall be able to create, view, update and deactivate physical rooms (room number, floor, type, status). |
| FR-ADM-04 | The system shall prevent deleting a room or room type that has active bookings (deactivation is used instead). |
| FR-ADM-05 | The admin shall be able to view all bookings with search (reference code, customer name/email) and filters (status, date range). |
| FR-ADM-06 | The admin shall be able to change booking status: Pending → Confirmed → Completed, or → Cancelled. |
| FR-ADM-07 | The admin shall be able to mark a booking's payment status as Paid or Unpaid. Payment status can be changed **only** by administrators; customers can view it but never modify it, and the server rejects any non-admin attempt. |
| FR-ADM-08 | The admin shall be able to view all users and block or unblock customer accounts. |
| FR-ADM-09 | The admin shall be able to view and moderate reviews. |

---

## 7. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | **Security** | Passwords hashed with bcrypt. Session tokens stored in HTTP-only, Secure, SameSite cookies. All inputs validated on the server with Zod. Role checks are enforced on the server, not only hidden in the UI. Secrets are kept in environment variables. |
| NFR-02 | **Data Integrity** | No two active bookings may overlap for the same physical room. Prices are always calculated on the server, never trusted from the client. |
| NFR-03 | **Performance** | Common pages should load within about 2–3 seconds on a normal broadband connection. Frequently queried fields (email, booking dates, room ID) are indexed. |
| NFR-04 | **Usability** | Clean, consistent UI with clear form error messages, loading states and confirmation dialogs for destructive actions. |
| NFR-05 | **Responsiveness** | Fully usable on mobile (≥360px), tablet and desktop screens. |
| NFR-06 | **Reliability** | Errors are handled gracefully with user-friendly messages. The application should not crash on invalid input. |
| NFR-07 | **Maintainability** | Modular folder structure, TypeScript strict mode, consistent naming, reusable components, Git version control. |
| NFR-08 | **Availability** | Deployed on a cloud platform (Vercel + MongoDB Atlas) and accessible 24/7 for demonstration. |
| NFR-09 | **Accessibility** | Semantic HTML, labelled form fields, keyboard navigation and sufficient color contrast (shadcn/ui is built on accessible Radix primitives). |
| NFR-10 | **Scalability (basic)** | The stateless JWT design and cloud database allow growth without architectural changes. |

---

## 8. Complete Feature List

### 8.1 General Users (Guests / Visitors)
- View home page with hotel introduction, featured rooms and availability search bar
- Browse all room types
- Filter rooms by price and guest capacity
- View room type details (images, amenities, price, capacity, reviews and average rating)
- Search availability for specific dates and number of guests
- View About / Contact information page
- Register a new account
- Log in

### 8.2 Registered Users (Customers)
*All guest features, plus:*
- Book an available room type for selected dates
- View booking summary and total price before confirming
- Add a special request note
- Receive an on-screen booking confirmation with a reference code
- View My Bookings (Upcoming / Past / Cancelled) with status and payment status
- View the details of a single booking
- Cancel an eligible booking
- Write a review for a completed stay
- View and edit profile (name, phone)
- Change password
- Log out

### 8.3 Administrators
- Secure admin login (same login page, role-based redirect)
- Dashboard with key statistics and lists of today's check-ins and check-outs
- **Room type management:** add, edit, deactivate/activate; set price, capacity, amenities, images
- **Room management:** add, edit, deactivate physical rooms; mark a room as under maintenance
- **Booking management:** view, search and filter all bookings; confirm, cancel or complete bookings; mark as paid or unpaid; view booking details with customer information
- **User management:** view all customers and their booking count; block/unblock accounts
- **Review moderation:** view all reviews; hide or delete reviews

---

## 9. System Modules

| # | Module | Responsibility |
|---|---|---|
| 1 | **Authentication Module** | Registration, login, logout, password hashing, JWT creation and verification, session cookie handling, route protection with role checks (middleware). |
| 2 | **User and Profile Module** | Profile viewing and editing, password change, customer's own data access. |
| 3 | **Room Catalogue Module** | Room types and physical rooms: data models, listing, details, filtering, admin CRUD. |
| 4 | **Availability Engine** | The core business logic. Given dates and guest count, finds which physical rooms are free using the overlap rule (Section 11.4). Used by both search and booking. |
| 5 | **Booking Module** | Booking creation (with server-side re-validation and price calculation), reference code generation, customer booking history, cancellation rules, status transitions. |
| 6 | **Review Module** | Eligibility check (completed booking), review creation, average rating calculation, moderation. |
| 7 | **Admin Dashboard Module** | Statistics aggregation, admin-only views for bookings, rooms, users and reviews. |
| 8 | **Shared / Core Module** | Database connection, Zod validation schemas, error handling, date utilities, reusable UI components (shadcn/ui), layout and navigation. |

### 9.1 Planned Page Map
**Public:** `/` (Home) · `/rooms` · `/rooms/[slug]` · `/search` · `/about` · `/login` · `/register`
**Customer:** `/booking/new` · `/booking/[id]/confirmation` · `/my-bookings` · `/my-bookings/[id]` · `/profile`
**Admin:** `/admin` (Dashboard) · `/admin/bookings` · `/admin/bookings/[id]` · `/admin/room-types` · `/admin/rooms` · `/admin/users` · `/admin/reviews`

---

## 10. User Workflows

### 10.1 Customer Workflow: From Registration to Successful Booking

```
[Visit Home Page]
      │
      ▼
[Enter check-in, check-out, guests] ──► [Search Results: available room types + price]
      │
      ▼
[Open Room Type Details] ──► [Click "Book Now"]
      │
      ▼
   Logged in? ──No──► [Login / Register] ──► (redirect back with dates kept)
      │Yes
      ▼
[Booking Summary Page]
  room type, dates, nights, guests, price/night, TOTAL, special request
      │
      ▼
[Click "Confirm Booking"]
      │
      ▼
[Server] validate input → re-check availability → assign free room
         → calculate total → save booking (Pending, Unpaid) → generate reference
      │
      ├── Room no longer available ──► [Error message + suggest new search]
      │
      ▼
[Booking Confirmation Page: reference code SE-XXXXXX, status Pending]
      │
      ▼
[My Bookings] ── track status (Pending → Confirmed) ── optional cancel before check-in
      │
      ▼
[After stay, admin marks Completed] ──► [Customer writes review]
```

**Step-by-step:**
1. The visitor opens the website and enters check-in date, check-out date and number of guests.
2. The system shows room types that can hold the guests and have at least one free room, with the total price for the stay.
3. The visitor opens a room type to see details, then clicks **Book Now**.
4. If not logged in, the visitor is sent to the login page (with a link to register). After logging in or registering, they return to the booking page with their dates kept.
5. The customer reviews the booking summary and optionally adds a special request.
6. The customer clicks **Confirm Booking**. The server re-validates everything and creates the booking.
7. A confirmation page shows the reference code and the status (Pending). Payment is made at the hotel.
8. The customer can track the booking in **My Bookings** and cancel it before check-in if needed.
9. After the stay is marked Completed, the customer can leave a rating and review.

### 10.2 Admin Workflow: Managing Bookings and Users

```
[Admin Login] ──► [Dashboard: stats, today's check-ins/check-outs, pending list]
      │
      ├──► [Bookings] ── filter "Pending" ── open booking
      │        ├─ Confirm  (Pending → Confirmed)
      │        ├─ Cancel   (Pending/Confirmed → Cancelled, room freed)
      │        ├─ Mark Paid (at check-in / on payment)
      │        └─ Complete (Confirmed → Completed, after check-out)
      │
      ├──► [Room Types] ── add / edit price, capacity, images / deactivate
      ├──► [Rooms] ── add room numbers / set maintenance / deactivate
      ├──► [Users] ── view customers & booking counts / block or unblock
      └──► [Reviews] ── hide or delete inappropriate reviews
```

**Booking status life cycle:**

```
            ┌──────────► CANCELLED ◄──────────┐
            │  (customer or admin)  (admin)   │
            │                                 │
  PENDING ──┴──(admin confirms)──► CONFIRMED ─┴──(admin, after check-out)──► COMPLETED
```

- Only **Pending** and **Confirmed** bookings block a room.
- Payment status (Unpaid / Paid) is tracked separately and updated by the admin.

**Typical daily admin routine:**
1. Log in and check the dashboard for pending bookings and today's check-ins and check-outs.
2. Review pending bookings and confirm (or cancel) them.
3. When a guest arrives and pays, mark the booking as **Paid**.
4. When a guest checks out, mark the booking as **Completed**.
5. Update room details or put a room under maintenance when needed.
6. Block customers who misuse the system (for example, repeated fake bookings).

---

## 11. Recommended Technology Stack

| Layer | Technology | Why it was chosen |
|---|---|---|
| Framework | **Next.js 16 (App Router, Turbopack, Cache Components)** | One project for frontend and backend, file-based routing, server components for fast pages, and an industry-standard tool. |
| Language | **TypeScript** (strict mode) | Catches type errors before runtime and makes the code self-documenting. |
| Styling | **Tailwind CSS** | Fast, consistent, responsive styling without writing large CSS files. |
| UI Components | **shadcn/ui** | Professional, accessible components (forms, dialogs, tables, date picker) copied into the project, so they are fully customisable. |
| Icons | **Lucide React** | Clean, consistent icon set that works directly with shadcn/ui. |
| Backend | **Next.js Route Handlers / Server Actions** | API logic lives in the same codebase. No separate Express server to deploy. |
| Database | **MongoDB (MongoDB Atlas free tier)** | Flexible document model, free cloud hosting, easy to set up. |
| ODM | **Mongoose** | Schemas, validation, relationships (`ref`/`populate`) and indexes on top of MongoDB. |
| Authentication | **JWT in an HTTP-only cookie** (`jose` for signing, `bcryptjs` for hashing) | Simple to understand and explain, stateless, works in Next.js middleware, and is secure against XSS token theft because JavaScript cannot read the cookie. |
| Validation | **Zod** + **React Hook Form** | One schema validates both the form (client) and the API (server). |
| Date handling | **date-fns** | Reliable night counting and date comparison. |
| Fonts | **Geist** via the `geist` package (self-hosted) | No request to Google Fonts at runtime, so the app also works offline during a demo. |
| Testing | **Vitest** + **mongodb-memory-server** | Fast automated tests that run against a real, throw-away MongoDB replica set, including transactions. |
| Version Control | **Git + GitHub** | Track progress and collaborate. Also useful as evidence for the report. |
| Deployment | **Vercel** (app) + **MongoDB Atlas** (database) | Both have free tiers and deploy directly from GitHub. |

**Version policy:** We use the latest **stable** versions that are compatible with each other, locked by `package-lock.json`. We do not use beta or canary releases. Versions installed in Phase 1: Next.js 16.4.6, React 19.3.0, TypeScript 5.9, Tailwind CSS 4.3, shadcn CLI 4.23 (Radix "Nova" style), Mongoose 9.12, Zod 4.6, React Hook Form 7.91, jose 6.2, bcryptjs 3.0, date-fns 4.4, lucide-react 1.72, Vitest 5.1, MongoDB server 8.2 (local/test).

**Database environments:**
- **Development:** `npm run db:local` starts a local single-node MongoDB **replica set** on port 27018 (data kept in `.mongo-data/`). It needs no MongoDB installation. A replica set is required because booking uses transactions.
- **Automated tests:** an in-memory replica set is created and destroyed per test file.
- **Deployment:** MongoDB Atlas (an M0 cluster is a replica set by default).

**Why session cookie + JWT instead of a library like NextAuth?** A custom implementation is small (about 100 lines), has no hidden behaviour, and lets you clearly explain how authentication works during the viva. That is valuable for an academic project.

---

## 12. Database Overview

### 12.1 Entities and Relationships

```
 ┌──────────┐ 1        * ┌───────────┐ *        1 ┌──────────┐ *      1 ┌────────────┐
 │   User   │────────────│  Booking  │────────────│   Room   │──────────│  RoomType  │
 └──────────┘  makes     └───────────┘  occupies  └──────────┘ belongs  └────────────┘
      │ 1                      │ 1                                           │ 1
      │                        │                                             │
      │ *                      │ 0..1                                        │ *
 ┌──────────┐  written for     │                                             │
 │  Review  │──────────────────┘                    Review ──── is about ────┘
 └──────────┘
```

- A **User** can make many **Bookings**. Each Booking belongs to one User.
- A **RoomType** (e.g. "Deluxe Double") has many physical **Rooms** (e.g. 201, 202, 203).
- Each **Booking** occupies exactly one **Room** and also stores its **RoomType** for easy querying.
- A **Review** belongs to one User, one RoomType and one completed Booking (one review per booking).

### 12.2 Collections and Fields

**`users`**
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | Primary key |
| name | String | Required, 2–60 characters |
| email | String | Required, unique, lowercase, indexed |
| phone | String | Required |
| passwordHash | String | bcrypt hash, never returned by the API |
| role | Enum | `customer` \| `admin` (default `customer`) |
| isBlocked | Boolean | Default `false` |
| createdAt / updatedAt | Date | Automatic timestamps |

**`roomtypes`**
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | Primary key |
| name | String | Required, unique (e.g. "Deluxe Double Room") |
| slug | String | Unique, URL-friendly (e.g. `deluxe-double-room`) |
| description | String | Required |
| pricePerNight | Number | Required, > 0 (BDT) |
| capacity | Number | Maximum number of guests |
| bedType | String | e.g. "1 King Bed" |
| sizeSqft | Number | Optional |
| amenities | [String] | e.g. ["Wi-Fi", "AC", "TV"] |
| images | [String] | Image URLs |
| isActive | Boolean | Inactive types are hidden from customers |
| createdAt / updatedAt | Date | Automatic timestamps |

**`rooms`**
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | Primary key |
| roomNumber | String | Required, unique (e.g. "201") |
| floor | Number | |
| roomType | ObjectId → RoomType | Required, indexed |
| status | Enum | `available` \| `maintenance` \| `inactive` |
| lockVersion | Number | Incremented inside every booking transaction that assigns this room; used as a room-level lock (see §12.5). Not shown in the UI. |
| createdAt / updatedAt | Date | Automatic timestamps |

**`bookings`**
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | Primary key |
| referenceCode | String | Unique, e.g. `SE-7K3P9Q` |
| user | ObjectId → User | Required, indexed |
| room | ObjectId → Room | Required, indexed |
| roomType | ObjectId → RoomType | Required (kept for queries and reviews) |
| checkIn | Date | Date only (stored as UTC midnight) |
| checkOut | Date | Date only, must be after checkIn |
| nights | Number | Calculated on the server |
| guests | Number | ≤ roomType.capacity |
| pricePerNight | Number | Price snapshot at booking time |
| totalPrice | Number | nights × pricePerNight |
| status | Enum | `pending` \| `confirmed` \| `cancelled` \| `completed` |
| paymentStatus | Enum | `unpaid` \| `paid` |
| specialRequest | String | Optional, max 500 characters |
| cancelledBy | Enum | `customer` \| `admin` (optional) |
| cancelledAt | Date | Optional |
| createdAt / updatedAt | Date | Automatic timestamps |

Index: compound `{ room: 1, checkIn: 1, checkOut: 1 }` for fast overlap checks.

**`reviews`**
| Field | Type | Notes |
|---|---|---|
| _id | ObjectId | Primary key |
| user | ObjectId → User | Required |
| roomType | ObjectId → RoomType | Required, indexed |
| booking | ObjectId → Booking | Required, **unique** (one review per booking) |
| rating | Number | 1–5 |
| comment | String | Required, max 1000 characters |
| isHidden | Boolean | Set by admin moderation |
| createdAt / updatedAt | Date | Automatic timestamps |

### 12.3 Why separate "RoomType" and "Room"?
Customers book a **kind** of room ("Deluxe Double"), but the hotel needs to know which **actual room** (No. 203) is occupied. Separating them lets the system count real availability (for example, "2 of 5 Deluxe rooms left") and assign a specific room automatically. This mirrors how real hotel systems work.

### 12.4 The Double-Booking Rule (Core Logic)
Two date ranges overlap if:

```
existing.checkIn < requested.checkOut  AND  existing.checkOut > requested.checkIn
```

A room is **free** for the requested dates if it has `status = available` and **no** booking with status `pending` or `confirmed` matches this condition. Check-out day is not counted as an occupied night, so one guest can check out on the same day another checks in.

### 12.5 Concurrency Protection (Room-Level Locking)

**Problem:** Two customers click "Confirm Booking" for the last free Deluxe room at the same moment. Both requests check availability, both see the room as free, and both save a booking. Result: a double booking. A simple "check, then insert" is not safe under concurrency.

**Solution:** Every booking is created inside a **MongoDB multi-document transaction**, and the transaction **writes to the chosen Room document first**. This acts as a room-level lock.

```
withTransaction(session):
  1. Validate input (dates, guests) with Zod.                      FR-AVAIL-02
  2. Load the RoomType (must be active, capacity ≥ guests).
  3. Find candidate rooms of that type with status = "available".  FR-AVAIL-06
  4. For each candidate room:
       a. LOCK:  Room.updateOne({ _id, status: "available" },
                                { $inc: { lockVersion: 1 } }, { session })
                 → if 0 documents matched, the room just became
                   unavailable; skip it.
       b. CHECK: is there a pending/confirmed booking for this room
                 overlapping [checkIn, checkOut)?                   FR-AVAIL-05
                 → yes: try the next room.
       c. INSERT the booking (status pending, unpaid, price snapshot)
                 and stop.                                          FR-BOOK-04/06/07
  5. No room left → abort with "No rooms available for these dates".
commit
```

**Why this works:** MongoDB does not allow two in-progress transactions to modify the same document. When two bookings try to lock the same room, the second one gets a `WriteConflict` error, labelled `TransientTransactionError`. The driver's `session.withTransaction()` automatically **retries** the whole callback. On retry, the transaction reads a fresh snapshot, sees the booking that was just committed, and moves on to the next free room or fails cleanly. Two bookings for the same room can never both commit.

The lock is **per room**, not per room type or global. Bookings for different rooms do not block each other.

**Supporting rules:**
- Transactions use `readConcern: "snapshot"` and `writeConcern: "majority"`.
- The transaction callback must not have outside side effects, because it may run more than once.
- An index `{ room: 1, checkIn: 1, checkOut: 1 }` keeps the overlap check fast.
- Admins cannot set a room to `maintenance`/`inactive` while it has future active bookings (FR-ADM-04). The lock in step 4a also checks `status: "available"`, so a room disabled during a booking is never assigned.
- Phase 1 already includes an automated test (`tests/db.test.ts`) that runs 8 concurrent "check-then-insert" transactions against one lock document and verifies that exactly one succeeds. Phase 4 will add the same test for the real booking service.

---

## 13. Project Limitations

1. **No online payment:** Payments are recorded manually by the admin. Customers pay at the hotel.
2. **Single hotel only:** The system manages one property.
3. **No automatic notifications:** Customers check booking status by logging in. No email or SMS is sent.
4. **Fixed pricing:** One price per room type, with no weekend, seasonal or discount pricing.
5. **Image handling:** Room images are stored as URLs (or static files in the project). There is no upload/storage service in the MVP.
6. **Free-tier hosting:** Vercel and MongoDB Atlas free tiers have usage limits that are fine for a demonstration but not for heavy production traffic.
7. **Basic password recovery:** "Forgot password" by email is not included because it needs an email service. An admin can help reset accounts.

### 13.1 Identified Risks and Mitigation
| Risk | Impact | Mitigation |
|---|---|---|
| Two customers book the last room at the same moment (race condition) | Double booking | MongoDB transaction with a room-level lock write and automatic retry on write conflict (§12.5). Covered by an automated concurrency test. |
| Timezone errors with dates | Wrong night count or overlap results | Store dates as date-only UTC midnight values and use one shared date utility everywhere. |
| Scope creep (adding too many features) | Project not finished on time | Follow the MoSCoW priorities strictly. Build all "Must Have" features first. |
| Package version incompatibilities | Setup and build failures | Use stable, pinned versions and test the build early. |
| Security mistakes (exposed routes) | Unauthorised access | Role checks in middleware **and** in every API handler. Test as guest, customer and admin. |
| Deployment issues close to the deadline | Demo failure | Deploy early (first week of development) and redeploy continuously. |

---

## 14. Future Enhancements

1. Online payment integration (SSLCommerz / bKash / Stripe sandbox, then live).
2. Email notifications for booking confirmation, cancellation and reminders.
3. Forgot-password flow with an email reset link.
4. Image upload to cloud storage (e.g. Cloudinary).
5. Dynamic pricing: weekend and seasonal rates, discount coupons.
6. Multi-hotel support with hotel-owner accounts (marketplace model).
7. Calendar view of room occupancy for admins.
8. Downloadable PDF invoices and booking reports.
9. Social login (Google).
10. Multi-language support (English / Bangla).
11. Analytics: occupancy trends and revenue charts over time.
12. Native or PWA mobile app.

---

## 15. Proposed Development Milestones (for reference)

| Phase | Work |
|---|---|
| 1. Setup | Project setup, packages, database connection, base layout, deployment pipeline |
| 2. Authentication | Register, login, logout, middleware, roles, admin seed script |
| 3. Room Catalogue | Models, admin CRUD for room types and rooms, public listing and details pages |
| 4. Availability and Booking | Availability engine, search, booking flow, My Bookings, cancellation |
| 5. Admin Management | Dashboard statistics, booking management, user management |
| 6. Reviews and Polish | Reviews, filters, responsive fixes, empty and error states |
| 7. Testing and Documentation | Functional testing against requirement IDs, seed demo data, final report and demo |

### 15.1 Phase Status
| Phase | Status |
|---|---|
| 1. Setup | ✅ Completed and verified (11 Nov 2026) |
| 2. Authentication | ⏳ Next |
| 3–7 | Not started |

---

## 16. Change Log

| Version | Date | Changes |
|---|---|---|
| 1.0 | 11 Nov 2026 | Initial plan, approved by supervisor. |
| 1.1 | 11 Nov 2026 | Supervisor requirements added: transaction + room-level locking (new §12.5, `Room.lockVersion` field, FR-BOOK-05 updated); Cancelled bookings explicitly non-blocking (FR-AVAIL-05); new FR-AVAIL-06 (maintenance/inactive rooms never available); FR-BOOK-04 clarified; date validation on frontend **and** backend (FR-AVAIL-02); payment status admin-only (FR-ADM-07). Phase 1 decisions recorded: Next.js 16 (`proxy.ts` replaces `middleware.ts`, FR-AUTH-07), self-hosted Geist font, Vitest + mongodb-memory-server testing, `npm run db:local` local replica set. |

---

*End of document.*
