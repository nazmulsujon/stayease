import { CircleAlert } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function FormAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Alert variant="destructive" role="alert">
      <CircleAlert aria-hidden />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
