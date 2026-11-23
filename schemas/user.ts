import { z } from "zod";

export const createUserSchema = z
  .object({
    telegramId: z
      .union([z.number().int().positive(), z.string().regex(/^\d+$/).transform(BigInt), z.bigint()])
      .optional(),
    email: z.email({ message: "Inserisci un'email valida" }).max(255).optional(),
    displayName: z.string().min(1, "Il nome visualizzato è obbligatorio").max(100),
    chesscomUsername: z.string().max(100).optional().nullable(),
    lichessUsername: z.string().max(100).optional().nullable(),
  })
  .refine((data) => data.telegramId !== undefined || (data.email !== undefined && data.email.trim() !== ""), {
    message: "È richiesto almeno un metodo di identificazione: telegramId o email",
    path: ["email"], // Evidenzia il campo email o il form in caso di errore
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
