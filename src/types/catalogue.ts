export const ROOM_STATUSES = ["available", "maintenance", "inactive"] as const;
export type RoomStatus = (typeof ROOM_STATUSES)[number];

export const ROOM_STATUS_LABELS: Record<RoomStatus, string> = {
  available: "Available",
  maintenance: "Under maintenance",
  inactive: "Inactive",
};

/** Plain, serialisable room type data passed to pages and components. */
export type RoomTypeDTO = {
  id: string;
  name: string;
  slug: string;
  description: string;
  pricePerNight: number;
  capacity: number;
  bedType: string;
  sizeSqft: number | null;
  amenities: string[];
  images: string[];
  isActive: boolean;
};

export type RoomTypeAdminRow = RoomTypeDTO & {
  totalRooms: number;
  availableRooms: number;
};

export type RoomDTO = {
  id: string;
  roomNumber: string;
  floor: number;
  status: RoomStatus;
  roomType: { id: string; name: string; isActive: boolean };
};
