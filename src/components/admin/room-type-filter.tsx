"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "all";

/** Filters the admin rooms table by room type via the ?type= URL parameter. */
export function RoomTypeFilter({
  roomTypes,
  selected,
}: {
  roomTypes: { id: string; name: string }[];
  selected?: string;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="room-type-filter" className="text-sm text-muted-foreground">
        Room type
      </label>
      <Select
        value={selected ?? ALL}
        onValueChange={(value) =>
          router.push(value === ALL ? "/admin/rooms" : `/admin/rooms?type=${value}`)
        }
      >
        <SelectTrigger id="room-type-filter" className="w-60">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All room types</SelectItem>
          {roomTypes.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
