import type { Flavor } from "../typeFlavors";
import { zStringMinLength1 } from "../utils/string.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";

export type SearchTextAlpha = Flavor<string, "SearchTextAlpha">;

const sanitizeAlpha = (text: string) =>
  text.replace(/[^a-zA-ZÀ-ÿ-]/g, " ").trim();
export const searchTextAlphaSchema: ZodSchemaWithInputMatchingOutput<SearchTextAlpha> =
  zStringMinLength1.transform(sanitizeAlpha);

export type SearchTextAlphaNumeric = Flavor<string, "SearchTextAlphaNumeric">;

const sanitizeAlphaNumeric = (text: string) =>
  text.replace(/[^a-zA-ZÀ-ÿ0-9-]/g, " ").trim();
export const searchTextAlphaNumericSchema: ZodSchemaWithInputMatchingOutput<SearchTextAlphaNumeric> =
  zStringMinLength1.transform(sanitizeAlphaNumeric);
