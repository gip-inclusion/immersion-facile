import { z } from "zod/v4";

// Details: https://www.pole-emploi.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html
const romeCodeRegex = /^[A-N]\d{4}$/;

export const romeCodeSchema = z
  .string()
  .regex(romeCodeRegex, "Code ROME incorrect");
