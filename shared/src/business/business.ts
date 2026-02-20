import z from "zod";
import type { Flavor } from "../typeFlavors";
import {
  zStringMinLength1,
  zStringPossiblyEmptyWithMax,
} from "../utils/string.schema";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";

export type BusinessName = Flavor<string, "BusinessName">;
export const businessNameSchema: ZodSchemaWithInputMatchingOutput<BusinessName> =
  zStringMinLength1;

export type BusinessNameCustomized = Flavor<string, "BusinessNameCustomized">;
export const customizedNameSchema: ZodSchemaWithInputMatchingOutput<BusinessNameCustomized> =
  z.string();

export type BusinessAddress = Flavor<string, "BusinessAddress">;
export const businessAddressSchema: ZodSchemaWithInputMatchingOutput<BusinessAddress> =
  zStringPossiblyEmptyWithMax(1000);
