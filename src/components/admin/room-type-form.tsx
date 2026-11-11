"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createRoomTypeAction, updateRoomTypeAction } from "@/actions/catalogue";
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
import { Textarea } from "@/components/ui/textarea";
import type { RoomTypeDTO } from "@/types/catalogue";
import {
  roomTypeSchema,
  type RoomTypeFormValues,
  type RoomTypeInput,
} from "@/validations/catalogue";

function toFormValues(roomType?: RoomTypeDTO): RoomTypeFormValues {
  return {
    name: roomType?.name ?? "",
    description: roomType?.description ?? "",
    pricePerNight: roomType ? String(roomType.pricePerNight) : "",
    capacity: roomType ? String(roomType.capacity) : "",
    bedType: roomType?.bedType ?? "",
    sizeSqft: roomType?.sizeSqft ? String(roomType.sizeSqft) : "",
    amenities: roomType?.amenities.join(", ") ?? "",
    images: roomType?.images.join("\n") ?? "",
  };
}

/** Create / edit form for a room type (FR-ADM-02). */
export function RoomTypeForm({ roomType }: { roomType?: RoomTypeDTO }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const isEdit = Boolean(roomType);

  const form = useForm<RoomTypeFormValues, unknown, RoomTypeInput>({
    resolver: zodResolver(roomTypeSchema),
    mode: "onTouched",
    defaultValues: toFormValues(roomType),
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() => {
    setFormError(undefined);
    // Send the raw strings; the server parses them with the same schema.
    const raw = form.getValues();
    startTransition(async () => {
      const result = roomType
        ? await updateRoomTypeAction(roomType.id, raw)
        : await createRoomTypeAction(raw);
      if (result.ok) {
        toast.success(isEdit ? "Room type updated" : "Room type created");
        router.push("/admin/room-types");
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
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor="name">Name</FieldLabel>
              <Input id="name" placeholder="e.g. Deluxe Double Room" aria-invalid={!!errors.name} {...form.register("name")} />
              {isEdit && (
                <FieldDescription>Renaming also changes the room&apos;s public web address.</FieldDescription>
              )}
              <FieldError errors={[errors.name]} />
            </Field>

            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor="description">Description</FieldLabel>
              <Textarea
                id="description"
                rows={5}
                placeholder="Describe the room, view and facilities…"
                aria-invalid={!!errors.description}
                {...form.register("description")}
              />
              <FieldError errors={[errors.description]} />
            </Field>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field data-invalid={!!errors.pricePerNight}>
                <FieldLabel htmlFor="pricePerNight">Price per night (BDT)</FieldLabel>
                <Input id="pricePerNight" inputMode="numeric" placeholder="5500" aria-invalid={!!errors.pricePerNight} {...form.register("pricePerNight")} />
                <FieldError errors={[errors.pricePerNight]} />
              </Field>
              <Field data-invalid={!!errors.capacity}>
                <FieldLabel htmlFor="capacity">Maximum guests</FieldLabel>
                <Input id="capacity" inputMode="numeric" placeholder="2" aria-invalid={!!errors.capacity} {...form.register("capacity")} />
                <FieldError errors={[errors.capacity]} />
              </Field>
              <Field data-invalid={!!errors.bedType}>
                <FieldLabel htmlFor="bedType">Bed type</FieldLabel>
                <Input id="bedType" placeholder="1 King Bed" aria-invalid={!!errors.bedType} {...form.register("bedType")} />
                <FieldError errors={[errors.bedType]} />
              </Field>
              <Field data-invalid={!!errors.sizeSqft}>
                <FieldLabel htmlFor="sizeSqft">Size in sq ft (optional)</FieldLabel>
                <Input id="sizeSqft" inputMode="numeric" placeholder="320" aria-invalid={!!errors.sizeSqft} {...form.register("sizeSqft")} />
                <FieldError errors={[errors.sizeSqft]} />
              </Field>
            </div>

            <Field data-invalid={!!errors.amenities}>
              <FieldLabel htmlFor="amenities">Amenities</FieldLabel>
              <Input id="amenities" placeholder="Wi-Fi, Air conditioning, Smart TV" aria-invalid={!!errors.amenities} {...form.register("amenities")} />
              <FieldDescription>Separate items with commas.</FieldDescription>
              <FieldError errors={[errors.amenities]} />
            </Field>

            <Field data-invalid={!!errors.images}>
              <FieldLabel htmlFor="images">Image URLs</FieldLabel>
              <Textarea
                id="images"
                rows={3}
                placeholder={"https://example.com/room-1.jpg\nhttps://example.com/room-2.jpg"}
                aria-invalid={!!errors.images}
                {...form.register("images")}
              />
              <FieldDescription>One https:// URL per line (up to 6). The first image is the cover photo.</FieldDescription>
              <FieldError errors={[errors.images]} />
            </Field>
          </FieldGroup>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button asChild variant="outline">
              <Link href="/admin/room-types">Cancel</Link>
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" aria-hidden />}
              {isEdit ? "Save changes" : "Create room type"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
