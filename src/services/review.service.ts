import { Types } from "mongoose";
import { Booking } from "@/models/booking";
import { Review, type ReviewDoc } from "@/models/review";
import type { ReviewInput } from "@/validations/review";

/**
 * Review Module (System Module 6): FR-REV-01 … FR-REV-04.
 * Reviewer names are shown as first name + last initial ("Ayesha R.") for privacy.
 */

const isId = (id: string) => Types.ObjectId.isValid(id) && /^[a-f\d]{24}$/i.test(id);

export type ReviewDTO = {
  id: string;
  rating: number;
  comment: string;
  authorName: string;
  roomTypeName: string;
  roomTypeSlug: string;
  isHidden: boolean;
  createdAt: string;
};

export type RatingSummary = { average: number; count: number };

export function displayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.` : parts[0];
}

type PopulatedReview = ReviewDoc & {
  user: { name: string } | null;
  roomType: { name: string; slug: string } | null;
};
type ReviewRefs = { user: PopulatedReview["user"]; roomType: PopulatedReview["roomType"] };

function toDTO(doc: PopulatedReview): ReviewDTO {
  return {
    id: String(doc._id),
    rating: doc.rating,
    comment: doc.comment,
    authorName: displayName(doc.user?.name ?? "Guest"),
    roomTypeName: doc.roomType?.name ?? "",
    roomTypeSlug: doc.roomType?.slug ?? "",
    isHidden: doc.isHidden,
    createdAt: doc.createdAt.toISOString(),
  };
}

async function findReviews(filter: object, limit = 0) {
  const docs = await Review.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate<ReviewRefs>("user", "name")
    .populate<ReviewRefs>("roomType", "name slug")
    .lean();
  return (docs as PopulatedReview[]).map(toDTO);
}

// ─── Public (FR-REV-03) ──────────────────────────────────────────────

export async function getRoomTypeReviews(roomTypeId: string) {
  if (!isId(roomTypeId)) return { reviews: [], summary: { average: 0, count: 0 } };
  const reviews = await findReviews({ roomType: roomTypeId, isHidden: false });
  const count = reviews.length;
  const average = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  return { reviews, summary: { average: Math.round(average * 10) / 10, count } };
}

/** Average rating per room type (visible reviews only), keyed by room type id. */
export async function getRatingSummaries(): Promise<Map<string, RatingSummary>> {
  const rows = await Review.aggregate<{ _id: Types.ObjectId; average: number; count: number }>([
    { $match: { isHidden: false } },
    { $group: { _id: "$roomType", average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), { average: Math.round(r.average * 10) / 10, count: r.count }]));
}

/** Recent, well-rated, visible reviews for the home page. */
export async function getFeaturedReviews(limit = 3) {
  return findReviews({ isHidden: false, rating: { $gte: 4 } }, limit);
}

/** Hotel-wide rating across all visible reviews. */
export async function getOverallRating(): Promise<RatingSummary> {
  const [row] = await Review.aggregate<{ average: number; count: number }>([
    { $match: { isHidden: false } },
    { $group: { _id: null, average: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  return row ? { average: Math.round(row.average * 10) / 10, count: row.count } : { average: 0, count: 0 };
}

// ─── Customer (FR-REV-01, FR-REV-02) ─────────────────────────────────

export type CreateReviewResult =
  | { ok: true; review: ReviewDTO }
  | { ok: false; message: string };

/** Only the booking's owner, only after the stay is completed, only once. */
export async function createReview(
  userId: string,
  bookingId: string,
  input: ReviewInput,
): Promise<CreateReviewResult> {
  if (!isId(userId) || !isId(bookingId)) return { ok: false, message: "Booking not found." };
  const booking = await Booking.findOne({ _id: bookingId, user: userId }).select("status roomType").lean();
  if (!booking) return { ok: false, message: "Booking not found." };
  if (booking.status !== "completed") {
    return { ok: false, message: "You can review a stay once it has been completed." };
  }
  try {
    const doc = await Review.create({
      user: userId,
      roomType: booking.roomType,
      booking: bookingId,
      rating: input.rating,
      comment: input.comment,
    });
    const [review] = await findReviews({ _id: doc._id }, 1);
    return { ok: true, review };
  } catch (error) {
    if ((error as { code?: number }).code === 11000) {
      return { ok: false, message: "You have already reviewed this stay." };
    }
    throw error;
  }
}

/** The user's review for a booking, if any (shown on the booking page). */
export async function getReviewForBooking(userId: string, bookingId: string): Promise<ReviewDTO | null> {
  if (!isId(userId) || !isId(bookingId)) return null;
  const [review] = await findReviews({ booking: bookingId, user: userId }, 1);
  return review ?? null;
}

// ─── Admin moderation (FR-REV-04) ────────────────────────────────────

export async function listReviewsForAdmin(filter: "all" | "visible" | "hidden" = "all") {
  const query = filter === "all" ? {} : { isHidden: filter === "hidden" };
  return findReviews(query, 200);
}

export async function setReviewHidden(id: string, isHidden: boolean): Promise<boolean> {
  if (!isId(id)) return false;
  const res = await Review.updateOne({ _id: id }, { $set: { isHidden } });
  return res.matchedCount === 1;
}

export async function deleteReview(id: string): Promise<boolean> {
  if (!isId(id)) return false;
  const res = await Review.deleteOne({ _id: id });
  return res.deletedCount === 1;
}
