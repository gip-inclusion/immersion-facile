import { z } from "zod/v4";

export type WithAcquisition = {
  acquisitionCampaign?: string | undefined;
  acquisitionKeyword?: string | undefined;
};

export const withAcquisitionSchema: z.Schema<WithAcquisition> = z.object({
  acquisitionCampaign: z.string().optional(),
  acquisitionKeyword: z.string().optional(),
});
