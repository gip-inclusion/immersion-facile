import { z } from "zod";
import type { InternshipKind } from "./convention/convention.dto";
import { internshipKindSchema } from "./convention/convention.schema";
import { emailSchema } from "./email/email.schema";
import {
  type ZodSchemaWithInputMatchingOutput,
  zStringMinLength1,
} from "./zodUtils";

export type ShareLinkByEmailDto = {
  conventionLink: string;
  internshipKind: InternshipKind;
  email: string;
  details: string;
};

export const shareLinkByEmailSchema: ZodSchemaWithInputMatchingOutput<ShareLinkByEmailDto> =
  z.object({
    internshipKind: internshipKindSchema,
    conventionLink: zStringMinLength1,
    email: emailSchema,
    details: zStringMinLength1,
  });
