"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { User } from "@/types";

// UUID fisso deterministico per l'utente Guest predefinito
export const DEFAULT_GUEST_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Ottiene o crea l'utente guest predefinito nel database
 */
export async function getOrCreateDefaultUser(): Promise<User> {
  // 1. Cerca se esiste già
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, DEFAULT_GUEST_USER_ID))
    .limit(1);

  if (existing[0]) {
    return existing[0];
  }

  // 2. Altrimenti lo inserisce
  const [created] = await db
    .insert(users)
    .values({
      id: DEFAULT_GUEST_USER_ID,
      displayName: "Guest User",
      email: "guest@chessanalyze.local",
    })
    .returning();

  return created;
}
