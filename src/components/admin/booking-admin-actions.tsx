"use client";

import { useState, useTransition } from "react";
import { Ban, CheckCheck, CircleCheck, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";
import { setPaymentStatusAction, updateBookingStatusAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { BookingStatus, PaymentStatus } from "@/types/booking";

type Action = "confirm" | "cancel" | "complete" | "paid" | "unpaid";

const CONFIRM_TEXT: Partial<Record<Action, { title: string; body: string; label: string }>> = {
  cancel: {
    title: "Cancel this booking?",
    body: "The room is released immediately and the guest will see the booking as cancelled by the hotel. This cannot be undone.",
    label: "Cancel booking",
  },
  complete: {
    title: "Mark as completed?",
    body: "Use this after the guest has checked out. The guest can then leave a review.",
    label: "Mark completed",
  },
};

/** Status and payment controls on the admin booking page (FR-ADM-06, FR-ADM-07). */
export function BookingAdminActions({
  bookingId,
  status,
  paymentStatus,
  canComplete,
}: {
  bookingId: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  canComplete: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [running, setRunning] = useState<Action>();
  const [confirming, setConfirming] = useState<Action>();

  const run = (action: Action) => {
    setRunning(action);
    startTransition(async () => {
      const result =
        action === "paid" || action === "unpaid"
          ? await setPaymentStatusAction(bookingId, action)
          : await updateBookingStatusAction(bookingId, action);
      if (result.ok) {
        toast.success(
          {
            confirm: "Booking confirmed",
            cancel: "Booking cancelled",
            complete: "Booking completed",
            paid: "Marked as paid",
            unpaid: "Marked as unpaid",
          }[action],
        );
        setConfirming(undefined);
      } else {
        toast.error(result.formError ?? "Could not update the booking.");
      }
      setRunning(undefined);
    });
  };

  const spinner = (a: Action) => pending && running === a && <Loader2 className="animate-spin" aria-hidden />;
  const isActive = status === "pending" || status === "confirmed";
  const dialog = confirming ? CONFIRM_TEXT[confirming] : undefined;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-sm font-medium">Booking status</p>
        <div className="flex flex-wrap gap-2">
          {status === "pending" && (
            <Button onClick={() => run("confirm")} disabled={pending}>
              {spinner("confirm") || <CircleCheck aria-hidden />} Confirm
            </Button>
          )}
          {status === "confirmed" && (
            <Button
              onClick={() => setConfirming("complete")}
              disabled={pending || !canComplete}
              title={canComplete ? undefined : "Available once the guest has checked in"}
            >
              <CheckCheck aria-hidden /> Mark completed
            </Button>
          )}
          {isActive && (
            <Button variant="destructive" onClick={() => setConfirming("cancel")} disabled={pending}>
              <Ban aria-hidden /> Cancel booking
            </Button>
          )}
          {!isActive && <p className="text-sm text-muted-foreground">No further status changes are possible.</p>}
        </div>
        {status === "confirmed" && !canComplete && (
          <p className="text-xs text-muted-foreground">“Mark completed” becomes available from the check-in date.</p>
        )}
      </div>

      {status !== "cancelled" && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Payment (pay at hotel)</p>
          {paymentStatus === "unpaid" ? (
            <Button variant="outline" onClick={() => run("paid")} disabled={pending}>
              {spinner("paid") || <Wallet aria-hidden />} Mark as paid
            </Button>
          ) : (
            <Button variant="outline" onClick={() => run("unpaid")} disabled={pending}>
              {spinner("unpaid")} Mark as unpaid
            </Button>
          )}
        </div>
      )}

      <Dialog open={Boolean(dialog)} onOpenChange={(open) => !open && setConfirming(undefined)}>
        {dialog && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialog.title}</DialogTitle>
              <DialogDescription>{dialog.body}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Go back</Button>
              </DialogClose>
              <Button
                variant={confirming === "cancel" ? "destructive" : "default"}
                onClick={() => confirming && run(confirming)}
                disabled={pending}
              >
                {confirming && spinner(confirming)}
                {dialog.label}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
