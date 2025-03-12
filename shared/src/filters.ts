import { z } from "zod";

export type DateFilter = {
  from?: Date;
  to?: Date;
};

export const dateFilterSchema: z.Schema<DateFilter> = z.object({
  from: z.date().optional(),
  to: z.date().optional(),
});
