import { z } from "../../node_modules/zod";

// Matches strings containing exactly 14 digits with any number of interspersed whitespaces.
const siretRegex = /(?:\s*\d){14}\s*/;
export const siretSchema = z
  .string()
  .regex(siretRegex, "SIRET doit étre composé de 14 chiffres");
