/**
 * Central, non-secret site configuration.
 * Change the hotel's public details here instead of hard-coding them in pages.
 */
export const siteConfig = {
  name: "StayEase",
  fullName: "StayEase Hotel Dhanmondi",
  tagline: "Comfortable stays, booked in minutes.",
  description:
    "A boutique city hotel in Dhanmondi, Dhaka. Check live availability, compare rooms and book your stay instantly.",
  currency: "BDT",
  locale: "en-BD",
  /** The hotel's time zone. "Today" for bookings is always the hotel's date. */
  timeZone: "Asia/Dhaka",
  contact: {
    address: "House 12, Road 7, Dhanmondi, Dhaka 1205, Bangladesh",
    phone: "+880 1700-000000",
    email: "reservations@stayease.example",
  },
  checkInTime: "2:00 PM",
  checkOutTime: "12:00 PM",
} as const;

export const mainNav = [
  { title: "Home", href: "/" },
  { title: "Rooms", href: "/rooms" },
  { title: "About", href: "/about" },
] as const;
