import { z } from "zod";
import { nafSchema } from "./naf";
import { Flavor } from "./typeFlavors";
import { zString } from "./zodUtils";

const normalizeSiret = (siret: string): string => siret.replace(/\s/g, "");

// Matches strings containing exactly 14 digits with any number of interspersed whitespaces.
const siretRegex = /^(?:\s*\d){14}\s*$/;

export const tooManySirenRequestsSiret = "42900000000429";
export const conflictErrorSiret = "40900000000409";
export const apiSirenNotAvailableSiret = "50300000000503";
export const apiSirenUnexpectedError = "66600666600666";

export type SiretDto = Flavor<string, "SiretDto">;
export const siretSchema: z.Schema<SiretDto> = zString
  .regex(siretRegex, "SIRET doit être composé de 14 chiffres")
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
