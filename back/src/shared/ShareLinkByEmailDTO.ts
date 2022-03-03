import { z } from "zod";

export type ShareLinkByEmailDTO = {
  immersionApplicationLink: string;
  email: string;
  details: string;
};

export const shareLinkByEmailSchema = z.object({
  email: z.string(),
  details: z.string().optional(),
  immersionApplicationLink: z.string(),
});
