import { z } from "zod/v4";
import { makeDateStringSchema } from "./schedule/Schedule.schema";
import type { DateString } from "./utils/date";

export type DateFilter = {
  from?: DateString;
  to?: DateString;
};

export const dateFilterSchema: z.Schema<DateFilter> = z.object({
  from: makeDateStringSchema().optional(),
  to: makeDateStringSchema().optional(),
});
