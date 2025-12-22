import { z } from "zod";
import { emailPossiblyEmptySchema, emailSchema } from "../email/email.schema";
import {
  type ZodSchemaWithInputMatchingOutput,
  zStringCanBeEmpty,
} from "../zodUtils";
import {
  conventionToShareSchema,
  type ShareConventionLinkByEmailDto,
} from "./shareConventionLinkByEmail.dto";

export const shareConventionLinkByEmailSchema: ZodSchemaWithInputMatchingOutput<ShareConventionLinkByEmailDto> =
  z
    .object({
      senderEmail: emailSchema,
      recipientEmail: emailPossiblyEmptySchema,
      details: zStringCanBeEmpty,
      convention: conventionToShareSchema,
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
