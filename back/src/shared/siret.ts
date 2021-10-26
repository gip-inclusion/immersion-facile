import { z } from "../../node_modules/zod";

const normalizeSiret = (siret: string): string => siret.replace(/\s/g, "");

// Matches strings containing exactly 14 digits with any number of interspersed whitespaces.
const siretRegex = /^(?:\s*\d){14}\s*$/;

export type SiretDto = z.infer<typeof siretSchema>;
export const siretSchema = z
  .string()
  .regex(siretRegex, "SIRET doit étre composé de 14 chiffres")
  .transform(normalizeSiret);
