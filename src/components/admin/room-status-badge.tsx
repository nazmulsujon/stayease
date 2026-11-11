import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ROOM_STATUS_LABELS, type RoomStatus } from "@/types/catalogue";

const styles: Record<RoomStatus, string> = {
  available: "bg-emerald-100 text-emerald-800",
  maintenance: "bg-amber-100 text-amber-800",
  inactive: "bg-muted text-muted-foreground",
};

export function RoomStatusBadge({ status }: { status: RoomStatus }) {
  return <Badge className={cn("font-medium", styles[status])}>{ROOM_STATUS_LABELS[status]}</Badge>;
}

export function ActiveBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge className={cn("font-medium", isActive ? styles.available : styles.inactive)}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
