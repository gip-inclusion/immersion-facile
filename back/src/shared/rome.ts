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

export type ProfessionDto = {
  romeCodeMetier: string; // 5 characters respecting regex : /[A-N]\d{4}/
  romeCodeAppellation?: string; // 5 digits (regex : /\d{5}/  )
  description: string;
};
export const professionSchema: z.Schema<ProfessionDto> = z.object({
  romeCodeMetier: romeCodeMetierSchema,
  romeCodeAppellation: romeCodeAppellationSchema.optional(),
  description: zTrimmedString,
});

export type MatchRangeDto = {
  startIndexInclusive: number;
  endIndexExclusive: number;
};
const matchRangeSchema: z.Schema<MatchRangeDto> = z.object({
  startIndexInclusive: z.number({ required_error: "Obligatoire" }).min(0).int(),
  endIndexExclusive: z.number({ required_error: "Obligatoire" }).min(0).int(),
});

export type RomeSearchMatchDto = {
  profession: ProfessionDto;
  matchRanges: MatchRangeDto[];
};
export const romeSearchMatchSchema: z.Schema<RomeSearchMatchDto> = z.object(
  {
    profession: professionSchema,
    matchRanges: z.array(matchRangeSchema),
  },
  { required_error: "Obligatoire" },
);

export const romeSearchResponseSchema = z.array(romeSearchMatchSchema, {
  required_error: "Obligatoire",
});
