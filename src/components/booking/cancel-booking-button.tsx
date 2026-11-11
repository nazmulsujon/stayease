"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cancelBookingAction } from "@/actions/booking";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

/** Customer cancellation with confirmation (FR-BOOK-09). */
export function CancelBookingButton({
  bookingId,
  referenceCode,
}: {
  bookingId: string;
  referenceCode: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const cancel = () =>
    startTransition(async () => {
      const result = await cancelBookingAction(bookingId);
      if (result.ok) {
        toast.success(`Booking ${referenceCode} cancelled`);
        setOpen(false);
      } else {
        toast.error(result.formError ?? "Could not cancel the booking.");
      }
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Cancel booking</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel booking {referenceCode}?</DialogTitle>
          <DialogDescription>
            The room will be released and offered to other guests. This cannot be undone. You can
            make a new booking at any time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep booking</Button>
          </DialogClose>
          <Button variant="destructive" disabled={pending} onClick={cancel}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Yes, cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
