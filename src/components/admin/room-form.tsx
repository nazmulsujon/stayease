"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createRoomAction, updateRoomAction } from "@/actions/catalogue";
import { applyServerFieldErrors } from "@/components/forms/apply-server-errors";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ROOM_STATUSES,
  ROOM_STATUS_LABELS,
  type RoomDTO,
} from "@/types/catalogue";
import {
  roomSchema,
  type RoomFormValues,
  type RoomInput,
} from "@/validations/catalogue";

type RoomTypeOption = { id: string; name: string; isActive: boolean };

/** Create / edit form for a physical room (FR-ADM-03). */
export function RoomForm({
  room,
  roomTypes,
  defaultRoomTypeId,
}: {
  room?: RoomDTO;
  roomTypes: RoomTypeOption[];
  defaultRoomTypeId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const isEdit = Boolean(room);

  const form = useForm<RoomFormValues, unknown, RoomInput>({
    resolver: zodResolver(roomSchema),
    mode: "onTouched",
    defaultValues: {
      roomNumber: room?.roomNumber ?? "",
      floor: room ? String(room.floor) : "",
      roomTypeId: room?.roomType.id ?? defaultRoomTypeId ?? "",
      status: room?.status ?? "available",
    },
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() => {
    setFormError(undefined);
    const raw = form.getValues();
    startTransition(async () => {
      const result = room ? await updateRoomAction(room.id, raw) : await createRoomAction(raw);
      if (result.ok) {
        toast.success(isEdit ? `Room ${raw.roomNumber.toUpperCase()} updated` : `Room ${raw.roomNumber.toUpperCase()} added`);
        router.push("/admin/rooms");
      } else {
        setFormError(result.formError);
        applyServerFieldErrors(result.fieldErrors, form.setError);
      }
    });
  });

  return (
    <Card>
      <CardContent>
        <form onSubmit={onSubmit} noValidate className="space-y-6">
          <FormAlert message={formError} />
          <FieldGroup>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field data-invalid={!!errors.roomNumber}>
                <FieldLabel htmlFor="roomNumber">Room number</FieldLabel>
                <Input id="roomNumber" placeholder="203" aria-invalid={!!errors.roomNumber} {...form.register("roomNumber")} />
                <FieldError errors={[errors.roomNumber]} />
              </Field>
              <Field data-invalid={!!errors.floor}>
                <FieldLabel htmlFor="floor">Floor</FieldLabel>
                <Input id="floor" inputMode="numeric" placeholder="2" aria-invalid={!!errors.floor} {...form.register("floor")} />
                <FieldDescription>Use 0 for the ground floor.</FieldDescription>
                <FieldError errors={[errors.floor]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.roomTypeId}>
              <FieldLabel htmlFor="roomTypeId">Room type</FieldLabel>
              <Controller
                control={form.control}
                name="roomTypeId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="roomTypeId" className="w-full" aria-invalid={!!errors.roomTypeId} onBlur={field.onBlur}>
                      <SelectValue placeholder="Choose a room type" />
                    </SelectTrigger>
                    <SelectContent>
                      {roomTypes.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                          {!t.isActive && " (inactive)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError errors={[errors.roomTypeId]} />
            </Field>

            <Field data-invalid={!!errors.status}>
              <FieldLabel htmlFor="status">Status</FieldLabel>
              <Controller
                control={form.control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status" className="w-full" aria-invalid={!!errors.status} onBlur={field.onBlur}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOM_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {ROOM_STATUS_LABELS[s]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldDescription>
                Rooms under maintenance or inactive are never offered to customers.
              </FieldDescription>
              <FieldError errors={[errors.status]} />
            </Field>
          </FieldGroup>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href="/admin/rooms">Cancel</Link>
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {isEdit ? "Save changes" : "Add room"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
