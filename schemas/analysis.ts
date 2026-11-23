import { z } from "zod";

/**
 * Schema per le statistiche sommarie di analisi (accuratezza, errori, blunder, ecc.)
 */
export const analysisSummarySchema = z.record(z.string(), z.any());

/**
 * Schema per il dato delle singole mosse analizzate (eval, best move, classificazione)
 */
export const movesDataSchema = z.union([
  z.array(z.record(z.string(), z.any())),
  z.record(z.string(), z.any()),
]);

/**
 * Schema per la creazione/salvataggio di un'analisi Stockfish
 */
export const createAnalysisSchema = z.object({
  gameId: z.string().uuid({ message: "gameId deve essere un UUID valido" }),
  depth: z
    .number()
    .int({ message: "La profondità (depth) deve essere un intero" })
    .min(1, { message: "La profondità minima è 1" })
    .max(50, { message: "La profondità massima è 50" })
    .default(15),
  whiteAccuracy: z
    .number()
    .min(0, { message: "L'accuratezza non può essere inferiore a 0" })
    .max(100, { message: "L'accuratezza non può superare 100" })
    .optional()
    .nullable(),
  blackAccuracy: z
    .number()
    .min(0, { message: "L'accuratezza non può essere inferiore a 0" })
    .max(100, { message: "L'accuratezza non può superare 100" })
    .optional()
    .nullable(),
  summary: analysisSummarySchema,
  movesData: movesDataSchema,
});

/**
 * Schema per l'aggiornamento parziale di un'analisi
 */
export const updateAnalysisSchema = createAnalysisSchema.partial().omit({ gameId: true });

export type CreateAnalysisInput = z.infer<typeof createAnalysisSchema>;
export type UpdateAnalysisInput = z.infer<typeof updateAnalysisSchema>;
