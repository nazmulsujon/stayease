import { randomInt } from "node:crypto";

/**
 * Booking reference codes such as "SE-7K3P9Q" (FR-BOOK-06).
 * Letters/digits that are easy to confuse (0/O, 1/I/L) are left out so a
 * guest can read the code over the phone. 31^6 ≈ 887 million combinations;
 * a unique index guarantees no duplicates.
 */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateReferenceCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `SE-${code}`;
}

export const REFERENCE_CODE_RE = /^SE-[2-9A-HJKMNP-Z]{6}$/;
