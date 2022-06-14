// Details: https://www.pole-emploi.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html
import { z } from "zod";
import { zTrimmedString } from "../zodUtils";
import { RomeSearchInput } from "./romeAndAppellation.dto";
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

export const romeAutocompleteInputSchema: z.Schema<RomeSearchInput> = z.object({
  searchText: zTrimmedString,
});

const matchRangeSchema: z.Schema<MatchRangeDto> = z.object({
  startIndexInclusive: z
    .number({
      required_error: "Début d'intervalle obligatoire",
    })
    .min(0)
    .int(),
  endIndexExclusive: z
    .number({
      required_error: "Fin d'intervalle obligatoire",
    })
    .min(0)
    .int(),
});

export const AppellationMatchSchema: z.Schema<AppellationMatchDto> = z.object(
  {
    appellation: appellationDtoSchema,
    matchRanges: z.array(matchRangeSchema),
  },
  { required_error: "Appelation obligatoire" },
);

export const appellationSearchResponseSchema = z.array(AppellationMatchSchema, {
  required_error: "Recherche d'appelation obligatoire",
});
