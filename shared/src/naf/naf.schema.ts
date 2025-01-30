import { keys } from "ramda";
import { z } from "zod";
import { searchTextSchema } from "../search/searchText.schema";
import { zStringMinLength1 } from "../zodUtils";
import {
  NafCode,
  NafDto,
  NafSectionSuggestion,
  NafSectorCode,
  SectionSuggestionsParams,
  WithNafCodes,
  nafSectorCodes,
  nafSectorLabels,
} from "./naf.dto";

export const validNafSectorCodes = keys(nafSectorLabels).filter(
  (val) => val !== "0",
);
export const nafSectorCodeSchema: z.Schema<NafSectorCode> =
  z.enum(nafSectorCodes);

const nafCodeSchema: z.Schema<NafCode> = z.string().length(5);

export const nafCodesSchema: z.Schema<NafCode[]> = z
  .array(nafCodeSchema)
  .nonempty();

export const withNafCodesSchema: z.Schema<WithNafCodes> = z.object({
  nafCodes: nafCodesSchema.optional(),
});

export const nafSchema: z.Schema<NafDto> = z.object({
  code: nafCodeSchema,
  nomenclature: z.string(),
});

const nafDivisionRegex = /\d{2}/;
export const nafDivisionSchema = z
  .string()
  .regex(nafDivisionRegex, "Division NAF incorrect");

export const sectionSuggestionSchema: z.Schema<NafSectionSuggestion> = z.object(
  {
    label: zStringMinLength1,
    nafCodes: nafCodesSchema,
  },
);
export const sectionSuggestionsSchema: z.Schema<NafSectionSuggestion[]> =
  z.array(sectionSuggestionSchema);
export const sectionSuggestionsParamsSchema: z.Schema<SectionSuggestionsParams> =
  z.object({
    searchText: searchTextSchema,
  });
