import { z } from "zod";

export const httpErrorSchema = z.object({
  status: z.number(),
  message: z.string(),
  issues: z.array(z.string()).optional(),
});

export const legacyUnauthenticatedErrorSchema = z.object({
  error: z.string(),
});

export const legacyBadRequestErrorSchema = z.object({
  errors: z.string(),
});
