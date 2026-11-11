"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  loginSchema,
  type LoginFormValues,
  type LoginInput,
} from "@/validations/auth";
import { applyServerFieldErrors } from "@/components/forms/apply-server-errors";
import { FormAlert } from "@/components/forms/form-alert";
import { PasswordInput } from "./password-input";

export function LoginForm({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();

  const form = useForm<LoginFormValues, unknown, LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit((values) => {
    setFormError(undefined);
    startTransition(async () => {
      // On success the action redirects, so a result only comes back on failure.
      const result = await loginAction(values, next);
      if (result) {
        setFormError(result.formError);
        applyServerFieldErrors(result.fieldErrors, form.setError);
        form.resetField("password");
      }
    });
  });

  const registerHref = next ? `/register?next=${encodeURIComponent(next)}` : "/register";

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormAlert message={formError} />
      <FieldGroup>
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
        <Field data-invalid={!!errors.password}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            {...form.register("password")}
          />
          <FieldError errors={[errors.password]} />
        </Field>
      </FieldGroup>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        {pending ? "Logging in…" : "Log in"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href={registerHref} className="font-medium text-primary hover:underline">
          Create one
        </Link>
      </p>
    </form>
  );
}
