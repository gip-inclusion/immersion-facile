// Details: https://www.pole-emploi.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html
import { z } from "zod";
import { zTrimmedString } from "../zodUtils";
import type {
  AppellationAndRomeDto,
  AppellationCode,
  AppellationMatchDto,
  MatchRangeDto,
  RomeCode,
  RomeDto,
  RomeSearchInput,
} from "./romeAndAppellation.dto";

const codeRomeRegex = /^[A-N]\d{4}$/;
export const codeRomeSchema: z.Schema<RomeCode> = z
  .string()
  .regex(codeRomeRegex, "Code ROME incorrect");

const codeAppellationRegex = /^\d{5}\d?$/; // 5 or 6 digits
export const codeAppellationSchema: z.Schema<AppellationCode> = z
  .string()
  .regex(codeAppellationRegex, "Code appellation incorrect");

export const appellationDtoSchema: z.Schema<AppellationAndRomeDto> = z.object({
  romeCode: codeRomeSchema,
  romeLabel: zTrimmedString,
  appellationCode: codeAppellationSchema,
  appellationLabel: zTrimmedString,
});

export const romeDtoSchema: z.Schema<RomeDto> = z.object({
  romeCode: codeRomeSchema,
  romeLabel: zTrimmedString,
});
export const romeListSchema: z.Schema<RomeDto[]> = z.array(romeDtoSchema);

export const romeAutocompleteInputSchema: z.Schema<RomeSearchInput> = z.object({
  searchText: zTrimmedString,
});

const matchRangeSchema: z.Schema<MatchRangeDto> = z.object({
  startIndexInclusive: z
    .number({
      required_error: "Début d'interval obligatoire",
    })
    .min(0)
    .int(),
  endIndexExclusive: z
    .number({
      required_error: "Fin d'interval obligatoire",
    })
    .min(0)
    .int(),
});

export const appellationMatchSchema: z.Schema<AppellationMatchDto> = z.object(
  {
    appellation: appellationDtoSchema,
    matchRanges: z.array(matchRangeSchema),
  },
  { required_error: "Veuillez saisir un métier" },
);

export const appellationSearchResponseSchema: z.Schema<AppellationMatchDto[]> =
  z.array(appellationMatchSchema, {
    required_error: "Veuillez saisir un métier",
  });
