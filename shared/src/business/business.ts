import type { Flavor } from "../typeFlavors";
import {
  type ZodSchemaWithInputMatchingOutput,
  zStringMinLength1,
} from "../zodUtils";

export type BusinessName = Flavor<string, "BusinessName">;
export const businessNameSchema: ZodSchemaWithInputMatchingOutput<BusinessName> =
  zStringMinLength1;
