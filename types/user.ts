import type { users, games } from "@/db/schema";

/**
 * Entità User di ritorno dal database (Select)
 */
export type User = typeof users.$inferSelect;

/**
 * Payload per l'inserimento di un nuovo User nel database (Insert)
 */
export type NewUser = typeof users.$inferInsert;

/**
 * Utente con le sue partite correlate
 */
export type UserWithGames = User & {
  games: (typeof games.$inferSelect)[];
};

/**
 * DTO sicuro esposto via API / frontend (omettendo eventuali campi interni se necessario)
 */
export type UserResponse = {
  id: string;
  telegramId: bigint | null;
  email: string | null;
  displayName: string;
  chesscomUsername: string | null;
  lichessUsername: string | null;
  createdAt: Date | null;
};
