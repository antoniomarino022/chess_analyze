import {
  pgTable,
  uuid,
  bigint,
  varchar,
  text,
  integer,
  numeric,
  jsonb,
  timestamp,
  unique,
  index,
  check,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    telegramId: bigint("telegram_id", { mode: "bigint" }).unique(),
    email: varchar("email", { length: 255 }).unique(),
    displayName: varchar("display_name", { length: 100 }).notNull(),
    chesscomUsername: varchar("chesscom_username", { length: 100 }),
    lichessUsername: varchar("lichess_username", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // Garantisce che ci sia almeno un metodo di identificazione
    check(
      "chk_user_identity",
      sql`${table.telegramId} IS NOT NULL OR ${table.email} IS NOT NULL`
    ),
  ]
);


export const games = pgTable(
  "games",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" }),
    pgnHash: varchar("pgn_hash", { length: 64 }).notNull(),
    pgn: text("pgn").notNull(),
    whitePlayer: varchar("white_player", { length: 100 }),
    blackPlayer: varchar("black_player", { length: 100 }),
    userColor: varchar("user_color", { length: 5 }),
    result: varchar("result", { length: 10 }),
    playedAt: timestamp("played_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      "chk_user_color",
      sql`${table.userColor} IN ('white', 'black')`
    ),
    // Evita di salvare due volte la stessa partita per lo stesso utente
    unique("uq_games_user_pgn_hash").on(table.userId, table.pgnHash),
    // Indice per velocizzare il caricamento dello storico partite
    index("idx_games_user_id").on(table.userId),
  ]
);


export const analyses = pgTable(
  "analyses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .unique()
      .references(() => games.id, { onDelete: "cascade" }),
    depth: integer("depth").notNull().default(15),
    whiteAccuracy: numeric("white_accuracy", { precision: 5, scale: 2 }),
    blackAccuracy: numeric("black_accuracy", { precision: 5, scale: 2 }),
    summary: jsonb("summary").notNull(),
    movesData: jsonb("moves_data").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    // Indice per velocizzare la ricerca dell'analisi per partita
    index("idx_analyses_game_id").on(table.gameId),
  ]
);

// Relazioni Drizzle ORM
export const usersRelations = relations(users, ({ many }) => ({
  games: many(games),
}));

export const gamesRelations = relations(games, ({ one }) => ({
  user: one(users, {
    fields: [games.userId],
    references: [users.id],
  }),
  analysis: one(analyses, {
    fields: [games.id],
    references: [analyses.gameId],
  }),
}));

export const analysesRelations = relations(analyses, ({ one }) => ({
  game: one(games, {
    fields: [analyses.gameId],
    references: [games.id],
  }),
}));

// Types per inferenza TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;

export type Analysis = typeof analyses.$inferSelect;
export type NewAnalysis = typeof analyses.$inferInsert;
