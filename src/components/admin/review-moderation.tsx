"use client";

import { useState, useTransition } from "react";
import { Eye, EyeOff, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { moderateReviewAction } from "@/actions/review";
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

/** Hide / show / delete one review (FR-REV-04). */
export function ReviewModeration({ id, isHidden }: { id: string; isHidden: boolean }) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const run = (action: "hide" | "show" | "delete") =>
    startTransition(async () => {
      const result = await moderateReviewAction(id, action);
      if (result.ok) {
        toast.success({ hide: "Review hidden", show: "Review visible again", delete: "Review deleted" }[action]);
        setOpen(false);
      } else {
        toast.error(result.formError ?? "Could not update the review.");
      }
    });

  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="sm" disabled={pending} onClick={() => run(isHidden ? "show" : "hide")}>
        {isHidden ? <Eye aria-hidden /> : <EyeOff aria-hidden />}
        {isHidden ? "Show" : "Hide"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" disabled={pending}>
            <Trash2 aria-hidden /> Delete
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this review permanently?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Consider hiding it instead if you may want it back later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button variant="destructive" disabled={pending} onClick={() => run("delete")}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              Delete review
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
