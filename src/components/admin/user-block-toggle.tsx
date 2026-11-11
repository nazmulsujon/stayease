"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { setUserBlockedAction } from "@/actions/admin";
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

/** Block / unblock a customer (FR-ADM-08). Blocking asks for confirmation. */
export function UserBlockToggle({ id, name, isBlocked }: { id: string; name: string; isBlocked: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const submit = (block: boolean) =>
    startTransition(async () => {
      const result = await setUserBlockedAction(id, block);
      if (result.ok) {
        toast.success(`${name} ${block ? "blocked" : "unblocked"}`);
        setOpen(false);
      } else {
        toast.error(result.formError ?? "Could not update the account.");
      }
    });

  if (isBlocked) {
    return (
      <Button variant="outline" size="sm" disabled={pending} onClick={() => submit(false)}>
        {pending && <Loader2 className="animate-spin" aria-hidden />}
        Unblock
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
          Block
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block {name}?</DialogTitle>
          <DialogDescription>
            They are logged out immediately and cannot log in or make bookings until unblocked.
            Their existing bookings are not changed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button variant="destructive" disabled={pending} onClick={() => submit(true)}>
            {pending && <Loader2 className="animate-spin" aria-hidden />}
            Block account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
