// Details: https://www.pole-emploi.fr/employeur/vos-recrutements/le-rome-et-les-fiches-metiers.html
import { z } from "zod";
import { searchTextAlphaSchema } from "../search/searchText.schema";
import { zStringMinLength1 } from "../utils/string.schema";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import type {
  AppelationSearchResponse,
  AppellationAndRomeDto,
  AppellationCode,
  AppellationLabel,
  AppellationMatchDto,
  AppellationSearchInputParams,
  MatchRangeDto,
  RomeCode,
  RomeLabel,
} from "./romeAndAppellation.dto";

const codeRomeRegex = /^[A-N]\d{4}$/;
export const codeRomeSchema: ZodSchemaWithInputMatchingOutput<RomeCode> = z
  .string()
  .regex(codeRomeRegex, "Code ROME incorrect");

export const romeLabelSchema: ZodSchemaWithInputMatchingOutput<RomeLabel> =
  zStringMinLength1;

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

export const appellationLabelSchema: ZodSchemaWithInputMatchingOutput<AppellationLabel> =
  zStringMinLength1;

export const appellationAndRomeDtoSchema: ZodSchemaWithInputMatchingOutput<AppellationAndRomeDto> =
  z.object(
    {
      romeCode: codeRomeSchema,
      romeLabel: romeLabelSchema,
      appellationCode: appellationCodeSchema,
      appellationLabel: appellationLabelSchema,
    },
    { error: "Ce champ est obligatoire. Veuillez choisir un métier." },
  );

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
      appellation: appellationAndRomeDtoSchema,
      matchRanges: z.array(matchRangeSchema),
    },
    { error: "Veuillez saisir un métier" },
  );

export const appellationSearchResponseSchema: ZodSchemaWithInputMatchingOutput<AppelationSearchResponse> =
  z.array(appellationMatchSchema, {
    error: "Veuillez saisir un métier",
  });

export const appellationSearchInputParamsSchema: ZodSchemaWithInputMatchingOutput<AppellationSearchInputParams> =
  z.object({
    searchText: searchTextAlphaSchema,
    fetchAppellationsFromNaturalLanguage: z.literal<true>(true).optional(),
  });
