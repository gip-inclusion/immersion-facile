import { z } from "zod";
import { type DateString, makeDateStringSchema } from "./utils/date";
import type { ZodSchemaWithInputMatchingOutput } from "./zodUtils";

export type DateFilter = {
  from?: DateString;
  to?: DateString;
};

export const dateFilterSchema: ZodSchemaWithInputMatchingOutput<DateFilter> =
  z.object({
    from: makeDateStringSchema().optional(),
    to: makeDateStringSchema().optional(),
  });
