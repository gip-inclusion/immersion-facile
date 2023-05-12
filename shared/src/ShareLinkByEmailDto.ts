import { z } from "zod";
import { InternshipKind } from "./convention/convention.dto";
import { internshipKindSchema } from "./convention/convention.schema";
import { AbsoluteUrl, absoluteUrlSchema } from "./AbsoluteUrl";
import { zEmail, zString } from "./zodUtils";

export type ShareLinkByEmailDto = {
  conventionLink: AbsoluteUrl;
  internshipKind: InternshipKind;
  email: string;
  details: string;
};

export const shareLinkByEmailSchema: z.Schema<ShareLinkByEmailDto> = z.object({
  internshipKind: internshipKindSchema,
  conventionLink: absoluteUrlSchema,
  email: zEmail,
  details: zString,
});
