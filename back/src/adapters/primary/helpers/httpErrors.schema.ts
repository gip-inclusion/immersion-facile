import { z } from "zod";

export const errorSchema = z.object({
  status: z.number(),
  message: z.string(),
  issues: z.array(z.string()).optional(),
});
