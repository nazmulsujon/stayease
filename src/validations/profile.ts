import { z } from "zod";
import { nameSchema, passwordSchema, phoneSchema } from "./auth";

/** FR-AUTH-09: profile details. Email is the login identity and is not editable. */
export const profileSchema = z.object({ name: nameSchema, phone: phoneSchema });

/** FR-AUTH-09: password change requires the current password. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, "Please confirm the new password"),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Passwords do not match",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "New password must be different from the current one",
  });

export type ProfileFormValues = z.input<typeof profileSchema>;
export type ProfileInput = z.output<typeof profileSchema>;
export type ChangePasswordFormValues = z.input<typeof changePasswordSchema>;
export type ChangePasswordInput = z.output<typeof changePasswordSchema>;
