import { z } from "zod";
import { emailPossiblyEmptySchema, emailSchema } from "../email/email.schema";
import {
  deepPartialSchema,
  type ZodSchemaWithInputMatchingOutput,
  zStringCanBeEmpty,
} from "../zodUtils";
import {
  immersionConventionSchema,
  miniStageConventionSchema,
} from "./convention.schema";
import type {
  ShareConventionLinkByEmailDto,
  SharedConventionDto,
} from "./shareConventionLinkByEmail.dto";

export const sharedConventionSchema: ZodSchemaWithInputMatchingOutput<SharedConventionDto> =
  (
    deepPartialSchema(immersionConventionSchema as unknown as z.ZodTypeAny).or(
      deepPartialSchema(miniStageConventionSchema as unknown as z.ZodTypeAny),
    ) as unknown as ZodSchemaWithInputMatchingOutput<SharedConventionDto>
  ).catch((ctx) => {
    const nonTooSmallErrors = ctx.issues.filter(
      (issue) => issue.code !== "too_small",
    );
    if (nonTooSmallErrors.length > 0) {
      throw new z.ZodError(nonTooSmallErrors as z.core.$ZodIssue[]);
    }
    return ctx.value as SharedConventionDto;
  });

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
