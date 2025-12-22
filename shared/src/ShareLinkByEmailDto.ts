import { z } from "zod";
import type { InternshipKind } from "./convention/convention.dto";
import { internshipKindSchema } from "./convention/convention.schema";
import { emailPossiblyEmptySchema, emailSchema } from "./email/email.schema";
import {
  type ZodSchemaWithInputMatchingOutput,
  zStringCanBeEmpty,
} from "./zodUtils";

export type ShareConventionByEmailDto = {
  internshipKind: InternshipKind;
  senderEmail: string;
  recipientEmail?: string;
  details?: string;
};

export const shareConventionByEmailSchema: ZodSchemaWithInputMatchingOutput<ShareConventionByEmailDto> =
  z
    .object({
      internshipKind: internshipKindSchema,
      senderEmail: emailSchema,
      recipientEmail: emailPossiblyEmptySchema,
      details: zStringCanBeEmpty,
    })
    .refine(
      (data) => {
        if (data.recipientEmail && data.recipientEmail.length > 0) {
          return data.details && data.details.length > 0;
        }
        return true;
      },
      {
        message:
          "L'adresse email du destinataire et le message sont obligatoires",
        path: ["details"],
      },
    );
