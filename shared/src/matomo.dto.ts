import { z } from "zod";

export type WithMatomo = {
  mtmCampaign?: string | undefined;
  mtmKwd?: string | undefined;
};

export const withMatomoSchema = z.object({
  mtmCampaign: z.string().optional(),
  mtmKwd: z.string().optional(),
}) as z.Schema<WithMatomo>;
