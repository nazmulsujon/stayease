"use server";

import { refresh } from "next/cache";
import {
  UNEXPECTED_FAILURE,
  fieldFailure,
  validationFailure,
  type ActionResult,
} from "@/lib/action-result";
import { authorize } from "@/lib/auth/dal";
import { dbConnect } from "@/lib/db";
import {
  createRoom,
  createRoomType,
  setRoomTypeActive,
  updateRoom,
  updateRoomType,
  type MutationResult,
} from "@/services/catalogue.service";
import { objectIdSchema, roomSchema, roomTypeSchema } from "@/validations/catalogue";

/**
 * Admin-only Server Actions for the room catalogue (FR-ADM-02, FR-ADM-03).
 * Every action re-checks the admin role against the database first
 * (FR-AUTH-07) — the admin UI being hidden from customers is not enough.
 */

async function requireAdmin(): Promise<ActionResult | null> {
  const auth = await authorize("admin");
  return auth.ok ? null : { ok: false, formError: auth.message };
}

function fromMutation<T>(result: MutationResult<T>, entity: string): ActionResult {
  if (result.ok) return { ok: true };
  if (result.reason === "not_found") {
    return { ok: false, formError: `This ${entity} no longer exists. Please reload the page.` };
  }
  if (result.reason === "blocked") return { ok: false, formError: result.message };
  return fieldFailure(result.field, result.message);
}

async function run(label: string, fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    await dbConnect();
    const denied = await requireAdmin();
    if (denied) return denied;
    const result = await fn();
    if (result.ok) refresh(); // make the admin tables and public pages show the change
    return result;
  } catch (error) {
    console.error(`[${label}]`, error);
    return UNEXPECTED_FAILURE;
  }
}

export async function createRoomTypeAction(values: unknown): Promise<ActionResult> {
  return run("createRoomTypeAction", async () => {
    const parsed = roomTypeSchema.safeParse(values);
    if (!parsed.success) return validationFailure(parsed.error);
    return fromMutation(await createRoomType(parsed.data), "room type");
  });
}

export async function updateRoomTypeAction(id: unknown, values: unknown): Promise<ActionResult> {
  return run("updateRoomTypeAction", async () => {
    const parsedId = objectIdSchema.safeParse(id);
    if (!parsedId.success) return { ok: false, formError: "Invalid room type." };
    const parsed = roomTypeSchema.safeParse(values);
    if (!parsed.success) return validationFailure(parsed.error);
    return fromMutation(await updateRoomType(parsedId.data, parsed.data), "room type");
  });
}

export async function setRoomTypeActiveAction(id: unknown, isActive: unknown): Promise<ActionResult> {
  return run("setRoomTypeActiveAction", async () => {
    const parsedId = objectIdSchema.safeParse(id);
    if (!parsedId.success || typeof isActive !== "boolean") {
      return { ok: false, formError: "Invalid request." };
    }
    return fromMutation(await setRoomTypeActive(parsedId.data, isActive), "room type");
  });
}

export async function createRoomAction(values: unknown): Promise<ActionResult> {
  return run("createRoomAction", async () => {
    const parsed = roomSchema.safeParse(values);
    if (!parsed.success) return validationFailure(parsed.error);
    return fromMutation(await createRoom(parsed.data), "room");
  });
}

export async function updateRoomAction(id: unknown, values: unknown): Promise<ActionResult> {
  return run("updateRoomAction", async () => {
    const parsedId = objectIdSchema.safeParse(id);
    if (!parsedId.success) return { ok: false, formError: "Invalid room." };
    const parsed = roomSchema.safeParse(values);
    if (!parsed.success) return validationFailure(parsed.error);
    return fromMutation(await updateRoom(parsedId.data, parsed.data), "room");
  });
}
