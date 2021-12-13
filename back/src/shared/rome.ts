import { z } from "../../node_modules/zod";
import { zTrimmedString } from "./zodUtils";

// Details: https://www.pole-emploi.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html
const romeCodeMetierRegex = /[A-N]\d{4}/;

export type RomeCodeMetierDto = z.infer<typeof romeCodeMetierSchema>;
export const romeCodeMetierSchema = z
  .string()
  .regex(romeCodeMetierRegex, "Code ROME incorrect");

export type RomeCodeAppellationDto = z.infer<typeof romeCodeAppellationSchema>;
const romeCodeAppellationRegex = /\d{5}/;
const romeCodeAppellationSchema = z
  .string()
  .regex(romeCodeAppellationRegex, "Code ROME incorrect");

export type ProfessionDto = z.infer<typeof professionSchema>;
export const professionSchema = z.object({
  romeCodeMetier: romeCodeMetierSchema,
  romeCodeAppellation: romeCodeAppellationSchema.optional(),
  description: zTrimmedString,
});

export type MatchRangeDto = z.infer<typeof matchRangeSchema>;
const matchRangeSchema = z.object({
  startIndexInclusive: z.number({ required_error: "Obligatoire" }).min(0).int(),
  endIndexExclusive: z.number({ required_error: "Obligatoire" }).min(0).int(),
});

export type RomeSearchMatchDto = z.infer<typeof romeSearchMatchSchema>;
export const romeSearchMatchSchema = z.object(
  {
    profession: professionSchema,
    matchRanges: z.array(matchRangeSchema),
  },
  { required_error: "Obligatoire" },
);

export type RomeSearchRequestDto = z.infer<typeof romeSearchRequestSchema>;
export const romeSearchRequestSchema = zTrimmedString;

export const romeSearchResponseSchema = z.array(romeSearchMatchSchema, {
  required_error: "Obligatoire",
});
