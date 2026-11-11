import { z } from "zod";

/**
 * Authentication schemas, shared by the forms (client-side validation)
 * and the Server Actions (authoritative server-side validation).
 */

/** Bangladeshi mobile number: 01XXXXXXXXX, optionally prefixed with +88 / 88. */
const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254, "Email is too long")
  .pipe(z.email("Enter a valid email address"))
  .transform((v) => v.toLowerCase());

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  // bcrypt only uses the first 72 bytes of a password.
  .max(72, "Password must be at most 72 characters")
  .regex(/[A-Za-z]/, "Password must contain at least one letter")
  .regex(/\d/, "Password must contain at least one number");

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(
    z.string().regex(BD_PHONE, "Enter a valid Bangladeshi mobile number (e.g. 01712345678)"),
  )
  // Store in one canonical form: 01XXXXXXXXX
  .transform((v) => v.slice(-11));

export const nameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(60, "Name must be at most 60 characters");

// FR-AUTH-01
export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

// FR-AUTH-04 — only presence is checked; the password policy is not
// revealed on the login form.
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required").max(200),
});

export type RegisterFormValues = z.input<typeof registerSchema>;
export type RegisterInput = z.output<typeof registerSchema>;
export type LoginFormValues = z.input<typeof loginSchema>;
export type LoginInput = z.output<typeof loginSchema>;
