"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changePasswordAction, updateProfileAction } from "@/actions/profile";
import { PasswordInput } from "@/components/auth/password-input";
import { applyServerFieldErrors } from "@/components/forms/apply-server-errors";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordFormValues,
  type ChangePasswordInput,
  type ProfileFormValues,
  type ProfileInput,
} from "@/validations/profile";

/** FR-AUTH-09: edit name and phone. */
export function ProfileForm({ defaults, email }: { defaults: ProfileFormValues; email: string }) {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const form = useForm<ProfileFormValues, unknown, ProfileInput>({
    resolver: zodResolver(profileSchema),
    mode: "onTouched",
    defaultValues: defaults,
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await updateProfileAction(values);
      if (result.ok) {
        toast.success("Profile updated");
        form.reset(values);
      } else {
        setFormError(result.formError);
        applyServerFieldErrors(result.fieldErrors, form.setError);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormAlert message={formError} />
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input id="email" value={email} disabled readOnly />
          <FieldDescription>Your email is your login and cannot be changed.</FieldDescription>
        </Field>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input id="name" autoComplete="name" aria-invalid={!!errors.name} {...form.register("name")} />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={!!errors.phone}>
          <FieldLabel htmlFor="phone">Mobile number</FieldLabel>
          <Input id="phone" type="tel" autoComplete="tel" aria-invalid={!!errors.phone} {...form.register("phone")} />
          <FieldError errors={[errors.phone]} />
        </Field>
      </FieldGroup>
      <Button type="submit" disabled={pending || !isDirty}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Save changes
      </Button>
    </form>
  );
}

/** FR-AUTH-09: change password (current password required). */
export function ChangePasswordForm() {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const empty = { currentPassword: "", newPassword: "", confirmNewPassword: "" };
  const form = useForm<ChangePasswordFormValues, unknown, ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onTouched",
    defaultValues: empty,
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await changePasswordAction(values);
      if (result.ok) {
        toast.success("Password changed");
        form.reset(empty);
      } else {
        setFormError(result.formError);
        applyServerFieldErrors(result.fieldErrors, form.setError);
      }
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <FormAlert message={formError} />
      <FieldGroup>
        <Field data-invalid={!!errors.currentPassword}>
          <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
          <PasswordInput id="currentPassword" autoComplete="current-password" aria-invalid={!!errors.currentPassword} {...form.register("currentPassword")} />
          <FieldError errors={[errors.currentPassword]} />
        </Field>
        <Field data-invalid={!!errors.newPassword}>
          <FieldLabel htmlFor="newPassword">New password</FieldLabel>
          <PasswordInput id="newPassword" autoComplete="new-password" aria-invalid={!!errors.newPassword} {...form.register("newPassword")} />
          <FieldDescription>At least 8 characters, including a letter and a number.</FieldDescription>
          <FieldError errors={[errors.newPassword]} />
        </Field>
        <Field data-invalid={!!errors.confirmNewPassword}>
          <FieldLabel htmlFor="confirmNewPassword">Confirm new password</FieldLabel>
          <PasswordInput id="confirmNewPassword" autoComplete="new-password" aria-invalid={!!errors.confirmNewPassword} {...form.register("confirmNewPassword")} />
          <FieldError errors={[errors.confirmNewPassword]} />
        </Field>
      </FieldGroup>
      <Button type="submit" variant="outline" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Change password
      </Button>
    </form>
  );
}
