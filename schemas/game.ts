import { z } from "zod";

/**
 * Valori ammessi per il colore dell'utente e il risultato della partita
 */
export const userColorEnum = z.enum(["white", "black"]);
export const gameResultEnum = z.enum(["1-0", "0-1", "1/2-1/2", "*"]);

/**
 * Schema per la creazione/inserimento di una partita
 */
export const createGameSchema = z.object({
  userId: z.uuid({ message: "userId deve essere un UUID valido" }),
  pgnHash: z
    .string()
    .length(64, { message: "pgnHash deve essere un hash SHA-256 di 64 caratteri esadecimali" })
    .regex(/^[a-fA-F0-9]{64}$/, { message: "pgnHash deve contenere solo caratteri esadecimali" }),
  pgn: z.string().min(1, { message: "Il PGN della partita non può essere vuoto" }),
  whitePlayer: z.string().max(100).optional().nullable(),
  blackPlayer: z.string().max(100).optional().nullable(),
  userColor: userColorEnum.optional().nullable(),
  result: z.string().max(10).optional().nullable(),
  playedAt: z.coerce.date().optional().nullable(),
});

/**
 * Schema per l'aggiornamento di una partita esistente
 */
export const updateGameSchema = createGameSchema.partial().omit({ userId: true, pgnHash: true });

export type CreateGameInput = z.infer<typeof createGameSchema>;
export type UpdateGameInput = z.infer<typeof updateGameSchema>;
