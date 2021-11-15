import { z } from "../../node_modules/zod";
import { nafSchema } from "./naf";

const normalizeSiret = (siret: string): string => siret.replace(/\s/g, "");

// Matches strings containing exactly 14 digits with any number of interspersed whitespaces.
const siretRegex = /^(?:\s*\d){14}\s*$/;

export type SiretDto = z.infer<typeof siretSchema>;
export const siretSchema = z
  .string()
  .regex(siretRegex, "SIRET doit étre composé de 14 chiffres")
  .transform(normalizeSiret);

export type GetSiretRequestDto = z.infer<typeof getSiretRequestSchema>;
export const getSiretRequestSchema = z.object({
  siret: siretSchema,
  includeClosedEstablishments: z.boolean().optional(),
});

export type GetSiretResponseDto = z.infer<typeof getSiretResponseSchema>;
const getSiretResponseSchema = z.object({
  siret: siretSchema,
  businessName: z.string(),
  businessAddress: z.string(),
  naf: nafSchema.optional(),
  // true if the office is currently open for business.
  isOpen: z.boolean(),
});
