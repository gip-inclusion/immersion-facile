import { z } from "zod";

export type HttpErrorBody = {
  status: number;
  message: string;
  issues?: string[];
};

export const httpErrorSchema: z.ZodSchema<HttpErrorBody> = z.object({
  status: z.number(),
  message: z.string(),
  issues: z.array(z.string()).optional(),
});
