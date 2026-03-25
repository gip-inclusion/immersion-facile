import type { Flavor } from "../typeFlavors";
import { zStringCanBeEmpty } from "../utils/string.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";

export type BusinessAddress = Flavor<string, "BusinessAddress">;
export const businessAddressSchema: ZodSchemaWithInputMatchingOutput<BusinessAddress> =
  zStringCanBeEmpty;
