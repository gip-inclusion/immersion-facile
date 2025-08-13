import { z } from "zod";
import type { ZodSchemaWithInputMatchingOutput } from "./zodUtils";

export type WithAcquisition = {
  acquisitionCampaign?: string | undefined;
  acquisitionKeyword?: string | undefined;
};

export const withAcquisitionSchema: ZodSchemaWithInputMatchingOutput<WithAcquisition> =
  z.object({
    acquisitionCampaign: z.string().optional(),
    acquisitionKeyword: z.string().optional(),
  });
