import type { Flavor } from "../typeFlavors";
import {
  zStringCanBeEmpty,
  zStringMinLength1Max255,
} from "../utils/string.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";

export type BusinessName = Flavor<string, "BusinessName">;
export const businessNameSchema: ZodSchemaWithInputMatchingOutput<BusinessName> =
  zStringMinLength1Max255;

export type BusinessNameCustomized = Flavor<string, "BusinessNameCustomized">;
export const customizedNameSchema: ZodSchemaWithInputMatchingOutput<BusinessNameCustomized> =
  zStringCanBeEmpty;
