import { z } from "../../node_modules/zod";

// Details: https://www.pole-emploi.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html
const romeCodeRegex = /^[A-N]\d{4}$/;

export type RomeCode = z.infer<typeof romeCodeSchema>;
export const romeCodeSchema = z
  .string()
  .regex(romeCodeRegex, "Code ROME incorrect");

export type AppellationCode = z.infer<typeof appellationSchema>;
const appellationCodeRegex = /^\d{5}\d?$/; // 5 or 6 digits
export const appellationSchema = z
  .string()
  .regex(appellationCodeRegex, "Code ROME incorrect");
