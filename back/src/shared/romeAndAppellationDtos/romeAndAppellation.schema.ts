// Details: https://www.pole-emploi.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html
import { z } from "zod";
import { zTrimmedString } from "../zodUtils";
import type {
  AppellationDto,
  AppellationMatchDto,
  AppellationCode,
  RomeCode,
  MatchRangeDto,
} from "./romeAndAppellation.dto";

const codeRomeRegex = /^[A-N]\d{4}$/;
export const codeRomeSchema: z.Schema<RomeCode> = z
  .string()
  .regex(codeRomeRegex, "Code ROME incorrect");

const codeAppellationRegex = /^\d{5}\d?$/; // 5 or 6 digits
const codeAppellationSchema: z.Schema<AppellationCode> = z
  .string()
  .regex(codeAppellationRegex, "Code ROME incorrect");

export const appellationDtoSchema: z.Schema<AppellationDto> = z.object({
  romeCode: codeRomeSchema,
  romeLabel: zTrimmedString,
  appellationCode: codeAppellationSchema,
  appellationLabel: zTrimmedString,
});

const matchRangeSchema: z.Schema<MatchRangeDto> = z.object({
  startIndexInclusive: z.number({ required_error: "Obligatoire" }).min(0).int(),
  endIndexExclusive: z.number({ required_error: "Obligatoire" }).min(0).int(),
});

export const AppellationMatchSchema: z.Schema<AppellationMatchDto> = z.object(
  {
    appellation: appellationDtoSchema,
    matchRanges: z.array(matchRangeSchema),
  },
  { required_error: "Obligatoire" },
);

export const appellationSearchResponseSchema = z.array(AppellationMatchSchema, {
  required_error: "Obligatoire",
});
