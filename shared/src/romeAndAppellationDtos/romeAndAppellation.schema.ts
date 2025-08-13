// Details: https://www.pole-emploi.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html
import { z } from "zod";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
  zStringMinLength1,
} from "../zodUtils";
import type {
  AppellationAndRomeDto,
  AppellationCode,
  AppellationMatchDto,
  MatchRangeDto,
  RomeCode,
} from "./romeAndAppellation.dto";

const codeRomeRegex = /^[A-N]\d{4}$/;
export const codeRomeSchema: ZodSchemaWithInputMatchingOutput<RomeCode> = z
  .string()
  .regex(codeRomeRegex, "Code ROME incorrect");

const codeAppellationRegex = /^\d{5}\d?$/; // 5 or 6 digits
export const appellationCodeSchema: ZodSchemaWithInputMatchingOutput<AppellationCode> =
  z
    .string({
      error: localization.required,
    })
    .regex(codeAppellationRegex, "Code appellation incorrect");

export const appellationCodeSchemaOptional: ZodSchemaWithInputMatchingOutput<
  AppellationCode | undefined
> = z.union([appellationCodeSchema, z.undefined()]);

export const appellationCodesSchema: ZodSchemaWithInputMatchingOutput<
  AppellationCode[]
> = z.array(appellationCodeSchema);

export const appellationDtoSchema: ZodSchemaWithInputMatchingOutput<AppellationAndRomeDto> =
  z.object({
    romeCode: codeRomeSchema,
    romeLabel: zStringMinLength1,
    appellationCode: appellationCodeSchema,
    appellationLabel: zStringMinLength1,
  });

const matchRangeSchema: ZodSchemaWithInputMatchingOutput<MatchRangeDto> =
  z.object({
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

export const appellationMatchSchema: ZodSchemaWithInputMatchingOutput<AppellationMatchDto> =
  z.object(
    {
      appellation: appellationDtoSchema,
      matchRanges: z.array(matchRangeSchema),
    },
    { error: "Veuillez saisir un métier" },
  );

export const appellationSearchResponseSchema: ZodSchemaWithInputMatchingOutput<
  AppellationMatchDto[]
> = z.array(appellationMatchSchema, {
  error: "Veuillez saisir un métier",
});
