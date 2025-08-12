import { z } from "zod";

export type WithAcquisition = {
  acquisitionCampaign?: string | undefined;
  acquisitionKeyword?: string | undefined;
};

export const withAcquisitionSchema: z.Schema<WithAcquisition> = z.object({
  acquisitionCampaign: z.string().optional(),
  acquisitionKeyword: z.string().optional(),
});
