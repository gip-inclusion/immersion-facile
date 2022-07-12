import { z } from "zod";

export const featuresSchemaResponse: z.Schema<{ features: unknown[] }> =
  z.object({
    features: z.array(z.unknown()),
  });
