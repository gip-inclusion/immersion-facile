import { z } from "zod";
import { validateEmailReasonSchema, zStringMinLength1 } from "shared";
import {
  EmailableApiKey,
  EmailableEmailValidationParams,
  EmailableEmailValidationStatus,
} from "./EmailableEmailValidationGateway.dto";

const emailableApiKeySchema: z.Schema<EmailableApiKey> = zStringMinLength1;

export const emailableValidationTargetsQueryParamsSchema: z.Schema<EmailableEmailValidationParams> =
  z.object({
    email: zStringMinLength1,
    api_key: emailableApiKeySchema,
  });

export const emailableEmailValidationStatusSchema: z.Schema<EmailableEmailValidationStatus> =
  z.object({
    accept_all: z.boolean().nullish(),
    did_you_mean: z.string().nullish(),
    disposable: z.boolean().nullish(),
    domain: z.string().nullish(),
    duration: z.number().optional(),
    email: z.string().nullish(),
    first_name: z.string().nullish(),
    free: z.boolean().nullish(),
    full_name: z.string().nullish(),
    gender: z.string().nullish(),
    last_name: z.string().nullish(),
    mailbox_full: z.boolean().nullish(),
    mx_record: z.string().nullish(),
    no_reply: z.boolean().nullish(),
    reason: validateEmailReasonSchema.nullish(),
    role: z.boolean().nullish(),
    score: z.number().nullish(),
    smtp_provider: z.string().nullish(),
    state: z
      .enum(["deliverable", "undeliverable", "unknown", "risky"])
      .nullish(),
    tag: z.string().nullish(),
    user: z.string().nullish(),
  });
