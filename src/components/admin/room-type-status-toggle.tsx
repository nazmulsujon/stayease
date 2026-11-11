"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setRoomTypeActiveAction } from "@/actions/catalogue";
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

/**
 * Activates or deactivates a room type (FR-ADM-02, FR-ADM-04).
 * Deactivation asks for confirmation because it hides the type from customers.
 */
export function RoomTypeStatusToggle({
  id,
  name,
  isActive,
}: {
  id: string;
  name: string;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (nextActive: boolean) =>
    startTransition(async () => {
      const result = await setRoomTypeActiveAction(id, nextActive);
      if (result.ok) {
        toast.success(`${name} ${nextActive ? "activated" : "deactivated"}`);
        setOpen(false);
      } else {
        toast.error(result.formError ?? "Could not update the room type.");
      }
    });

  if (!isActive) {
    return (
      <Button variant="outline" size="sm" disabled={pending} onClick={() => submit(true)}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Activate
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          Deactivate
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deactivate {name}?</DialogTitle>
          <DialogDescription>
            Customers will no longer see this room type, and its rooms cannot be booked.
            Existing data is kept, and you can activate it again at any time.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" disabled={pending} onClick={() => submit(false)}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Deactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
