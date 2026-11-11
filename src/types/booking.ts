export const BOOKING_STATUSES = ["pending", "confirmed", "cancelled", "completed"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** Statuses that occupy a room and block availability (FR-AVAIL-05). */
export const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed"] as const satisfies readonly BookingStatus[];

export const PAYMENT_STATUSES = ["unpaid", "paid"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
};

/** Search result for one room type (FR-AVAIL-04). */
export type RoomTypeAvailability = {
  roomType: {
    id: string;
    name: string;
    slug: string;
    description: string;
    capacity: number;
    bedType: string;
    sizeSqft: number | null;
    image: string | undefined;
    pricePerNight: number;
  };
  availableRooms: number;
  nights: number;
  totalPrice: number;
};

/** Serialisable booking passed to pages. Dates are "YYYY-MM-DD". */
export type BookingDTO = {
  id: string;
  referenceCode: string;
  roomType: { id: string; name: string; slug: string; image: string | undefined };
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  pricePerNight: number;
  totalPrice: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  specialRequest: string;
  cancelledBy: "customer" | "admin" | null;
  createdAt: string; // ISO timestamp
  /** Computed: the customer may still cancel this booking (FR-BOOK-09). */
  canCancel: boolean;
};
