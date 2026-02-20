import { keys } from "ramda";
import { z } from "zod";
import { searchTextAlphaSchema } from "../search/searchText.schema";
import { zStringMinLength1 } from "../utils/string.schema";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import {
  type NafCode,
  type NafDto,
  type NafSectionSuggestion,
  type NafSectionSuggestionsParams,
  type NafSectorCode,
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

export const nafCodeSchema: ZodSchemaWithInputMatchingOutput<NafCode> = z
  .string()
  .length(5);

export const nafCodesSchema: ZodSchemaWithInputMatchingOutput<NafCode[]> = z
  .array(nafCodeSchema)
  .nonempty();

export const withNafCodesSchema: ZodSchemaWithInputMatchingOutput<WithNafCodes> =
  z.object({
    nafCodes: nafCodesSchema.optional(),
  });

export const nafSchema: ZodSchemaWithInputMatchingOutput<NafDto> = z.object({
  code: nafCodeSchema,
  nomenclature: z.string(),
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
