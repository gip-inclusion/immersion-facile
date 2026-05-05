import { z } from "zod";
import { searchTextAlphaSchema } from "../search/searchText.schema";
import {
  makeHardenedStringSchema,
  stringWithMaxLength255,
  zStringMinLength1Max1024,
} from "../utils/string.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type {
  NafCode,
  NafDto,
  NafNomenclature,
  NafSectionSuggestion,
  NafSectionSuggestionsParams,
  NafSousClasseLabel,
  WithNafCodes,
} from "./naf.dto";

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

export const nafSectionSuggestionSchema: ZodSchemaWithInputMatchingOutput<NafSectionSuggestion> =
  z.object({
    label: zStringMinLength1Max1024,
    nafCodes: nafCodesSchema,
  });
export const nafSectionSuggestionsSchema: ZodSchemaWithInputMatchingOutput<
  NafSectionSuggestion[]
> = z.array(nafSectionSuggestionSchema);

export const nafSectionSuggestionsParamsSchema: ZodSchemaWithInputMatchingOutput<NafSectionSuggestionsParams> =
  z.object({
    searchText: searchTextAlphaSchema,
  });
