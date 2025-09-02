// Details: https://www.pole-emploi.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html
import { z } from "zod/v4";
import { localization, zStringMinLength1 } from "../zodUtils";
import type {
  AppellationAndRomeDto,
  AppellationCode,
  AppellationMatchDto,
  MatchRangeDto,
  RomeCode,
} from "./romeAndAppellation.dto";

const codeRomeRegex = /^[A-N]\d{4}$/;
export const codeRomeSchema: z.Schema<RomeCode> = z
  .string()
  .regex(codeRomeRegex, "Code ROME incorrect");

const codeAppellationRegex = /^\d{5}\d?$/; // 5 or 6 digits
export const appellationCodeSchema: z.Schema<AppellationCode> = z
  .string({
    error: localization.required,
  })
  .regex(codeAppellationRegex, "Code appellation incorrect");

export const appellationCodeSchemaOptional: z.Schema<
  AppellationCode | undefined
> = z.union([appellationCodeSchema, z.undefined()]);

export const appellationCodesSchema: z.Schema<AppellationCode[]> = z.array(
  appellationCodeSchema,
);

export const appellationDtoSchema: z.Schema<AppellationAndRomeDto> = z.object({
  romeCode: codeRomeSchema,
  romeLabel: zStringMinLength1,
  appellationCode: appellationCodeSchema,
  appellationLabel: zStringMinLength1,
});

const matchRangeSchema: z.Schema<MatchRangeDto> = z.object({
  startIndexInclusive: z
    .number({
      error: "Début d'intervalle obligatoire",
    })
    .min(0)
    .int(),
  endIndexExclusive: z
    .number({
      error: "Fin d'intervalle obligatoire",
    })
    .min(0)
    .int(),
});

export const appellationMatchSchema: z.Schema<AppellationMatchDto> = z.object(
  {
    appellation: appellationDtoSchema,
    matchRanges: z.array(matchRangeSchema),
  },
  { error: "Veuillez saisir un métier" },
);

export const appellationSearchResponseSchema: z.Schema<AppellationMatchDto[]> =
  z.array(appellationMatchSchema, {
    error: "Veuillez saisir un métier",
  });
