import { z } from "zod";
import { emailPossiblyEmptySchema, emailSchema } from "../email/email.schema";
import {
  type ZodSchemaWithInputMatchingOutput,
  zStringCanBeEmpty,
} from "../zodUtils";
import type { ConventionDto } from "./convention.dto";
import {
  immersionConventionSchema,
  miniStageConventionSchema,
} from "./convention.schema";
import type { ConventionPresentation } from "./conventionPresentation.dto";
import type { ShareConventionLinkByEmailDto } from "./shareConventionLinkByEmail.dto";

export const sharedConventionSchema: ZodSchemaWithInputMatchingOutput<
  Partial<ConventionPresentation>
> = (immersionConventionSchema as unknown as z.ZodObject<any>)
  .partial()
  .or(
    (miniStageConventionSchema as unknown as z.ZodObject<any>).partial(),
  ) as unknown as ZodSchemaWithInputMatchingOutput<ConventionDto>;

export const shareConventionLinkByEmailSchema: ZodSchemaWithInputMatchingOutput<ShareConventionLinkByEmailDto> =
  z
    .object({
      senderEmail: emailSchema,
      recipientEmail: emailPossiblyEmptySchema,
      details: zStringCanBeEmpty,
      convention: sharedConventionSchema,
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
