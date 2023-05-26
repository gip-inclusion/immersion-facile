import { z } from "zod";
import { InternshipKind } from "./convention/convention.dto";
import { internshipKindSchema } from "./convention/convention.schema";
import { emailSchema } from "./email/email.schema";
import { zString } from "./zodUtils";

export type ShareLinkByEmailDto = {
  conventionLink: string;
  internshipKind: InternshipKind;
  email: string;
  details: string;
};

export const shareLinkByEmailSchema: z.Schema<ShareLinkByEmailDto> = z.object({
  internshipKind: internshipKindSchema,
  conventionLink: zString,
  email: emailSchema,
  details: zString,
});
