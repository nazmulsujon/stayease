"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  registerSchema,
  type RegisterFormValues,
  type RegisterInput,
} from "@/validations/auth";
import { applyServerFieldErrors } from "./apply-server-errors";
import { FormAlert } from "./form-alert";
import { PasswordInput } from "./password-input";

export function RegisterForm({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();

  const form = useForm<RegisterFormValues, unknown, RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched",
    defaultValues: { name: "", email: "", phone: "", password: "", confirmPassword: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await registerAction(values, next);
      if (result) {
        setFormError(result.formError);
        applyServerFieldErrors(result.fieldErrors, form.setError);
      }
    });
  });

  const loginHref = next ? `/login?next=${encodeURIComponent(next)}` : "/login";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormAlert message={formError} />
      <FieldGroup>
        <Field data-invalid={!!errors.name}>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <Input
            id="name"
            autoComplete="name"
            placeholder="e.g. Ayesha Rahman"
            aria-invalid={!!errors.name}
            {...form.register("name")}
          />
          <FieldError errors={[errors.name]} />
        </Field>
        <Field data-invalid={!!errors.email}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={!!errors.email}
            {...form.register("email")}
          />
          <FieldError errors={[errors.email]} />
        </Field>
        <Field data-invalid={!!errors.phone}>
          <FieldLabel htmlFor="phone">Mobile number</FieldLabel>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01712345678"
            aria-invalid={!!errors.phone}
            {...form.register("phone")}
          />
          <FieldError errors={[errors.phone]} />
        </Field>
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby="password-hint"
            {...form.register("password")}
          />
          <FieldDescription id="password-hint">
            At least 8 characters, including a letter and a number.
          </FieldDescription>
          <FieldError errors={[errors.password]} />
        </Field>
        <Field data-invalid={!!errors.confirmPassword}>
          <FieldLabel htmlFor="confirmPassword">Confirm password</FieldLabel>
          <PasswordInput
            id="confirmPassword"
            autoComplete="new-password"
            aria-invalid={!!errors.confirmPassword}
            {...form.register("confirmPassword")}
          />
          <FieldError errors={[errors.confirmPassword]} />
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {pending ? "Creating account…" : "Create account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={loginHref} className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
