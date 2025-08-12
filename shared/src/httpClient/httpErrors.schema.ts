import { z } from "zod";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";

export type HttpErrorBody = {
  status: number;
  message: string;
  issues?: string[];
};

export const httpErrorSchema: ZodSchemaWithInputMatchingOutput<HttpErrorBody> =
  z.object({
    status: z.number(),
    message: z.string(),
    issues: z.array(z.string()).optional(),
  });
