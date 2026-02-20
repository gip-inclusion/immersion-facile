import { keys } from "ramda";
import { z } from "zod";
import { searchTextAlphaSchema } from "../search/searchText.schema";
import {
  makeHardenedStringSchema,
  stringWithMaxLength255,
  zStringMinLength1,
} from "../utils/string.schema";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import {
  type NafCode,
  type NafDto,
  type NafNomenclature,
  type NafSectionLabel,
  type NafSectionSuggestion,
  type NafSectionSuggestionsParams,
  type NafSectorCode,
  type NafSousClasseLabel,
  nafSectorCodes,
  nafSectorLabels,
  type WithNafCodes,
} from "./naf.dto";

export const validNafSectorCodes = keys(nafSectorLabels).filter(
  (val) => val !== "0",
);

export const nafSectorCodeSchema: ZodSchemaWithInputMatchingOutput<NafSectorCode> =
  z.enum(nafSectorCodes, {
    error: localization.invalidEnum,
  });

export const nafSectionLabelSchema: ZodSchemaWithInputMatchingOutput<NafSectionLabel> =
  stringWithMaxLength255;

export const nafSousClasseLabelSchema: ZodSchemaWithInputMatchingOutput<NafSousClasseLabel> =
  stringWithMaxLength255;

export const nafCodeSchema: ZodSchemaWithInputMatchingOutput<NafCode> =
  makeHardenedStringSchema({
    max: 5,
    isEmptyAllowed: true, // ISO legacy mais ça pose la question
  });

export const nafCodesSchema: ZodSchemaWithInputMatchingOutput<NafCode[]> = z
  .array(nafCodeSchema)
  .nonempty();

export const withNafCodesSchema: ZodSchemaWithInputMatchingOutput<WithNafCodes> =
  z.object({
    nafCodes: nafCodesSchema.optional(),
  });

//Correspond aux données du type 'NAFRev2' : remplacer par template litterals?
const nafNomenclatureSchema: ZodSchemaWithInputMatchingOutput<NafNomenclature> =
  makeHardenedStringSchema({
    max: 50,
    isEmptyAllowed: true, // ISO legacy mais ça pose la question
  });

export const nafSchema: ZodSchemaWithInputMatchingOutput<NafDto> = z.object({
  code: nafCodeSchema,
  nomenclature: nafNomenclatureSchema,
});

const nafDivisionRegex = /\d{2}/;
export const nafDivisionSchema = z
  .string()
  .regex(nafDivisionRegex, "Division NAF incorrect");

export const nafSectionSuggestionSchema: ZodSchemaWithInputMatchingOutput<NafSectionSuggestion> =
  z.object({
    label: zStringMinLength1,
    nafCodes: nafCodesSchema,
  });
export const nafSectionSuggestionsSchema: ZodSchemaWithInputMatchingOutput<
  NafSectionSuggestion[]
> = z.array(nafSectionSuggestionSchema);
export const nafSectionSuggestionsParamsSchema: ZodSchemaWithInputMatchingOutput<NafSectionSuggestionsParams> =
  z.object({
    searchText: searchTextAlphaSchema,
  });
z.object({
  searchText: searchTextAlphaSchema,
});
