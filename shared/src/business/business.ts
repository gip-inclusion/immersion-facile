import type z from "zod";
import type { Flavor } from "../typeFlavors";
import { zStringMinLength1 } from "../zodUtils";

export type BusinessName = Flavor<string, "BusinessName">;
export const businessNameSchema: z.Schema<BusinessName> = zStringMinLength1;
