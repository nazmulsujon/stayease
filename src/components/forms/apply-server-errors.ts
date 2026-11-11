import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

/** Copies per-field errors returned by a Server Action into React Hook Form. */
export function applyServerFieldErrors<T extends FieldValues>(
  fieldErrors: Record<string, string[] | undefined> | undefined,
  setError: UseFormSetError<T>,
) {
  if (!fieldErrors) return;
  let first = true;
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (!messages?.length) continue;
    setError(field as Path<T>, { type: "server", message: messages[0] }, { shouldFocus: first });
    first = false;
  }
}
