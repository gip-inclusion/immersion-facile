import { z } from "zod";
import { validateEmailReasonSchema, zString } from "shared";
import {
  EmailableApiKey,
  EmailableEmailValidationParams,
  EmailableEmailValidationStatus,
} from "./EmailableEmailValidationGateway.dto";

const emailableApiKeySchema: z.Schema<EmailableApiKey> = zString;

export const emailableValidationTargetsQueryParamsSchema: z.Schema<EmailableEmailValidationParams> =
  z.object({
    email: zString,
    api_key: emailableApiKeySchema,
  });

export const emailableEmailValidationStatusSchema: z.Schema<EmailableEmailValidationStatus> =
  z.object({
    accept_all: z.boolean().nullish(),
    did_you_mean: zString.nullish(),
    disposable: z.boolean().nullish(),
    domain: zString.nullish(),
    duration: z.number().optional(),
    email: zString.nullish(),
    first_name: zString.nullish(),
    free: z.boolean().nullish(),
    full_name: zString.nullish(),
    gender: zString.nullish(),
    last_name: zString.nullish(),
    mailbox_full: z.boolean().nullish(),
    mx_record: zString.nullish(),
    no_reply: z.boolean().nullish(),
    reason: validateEmailReasonSchema,
    role: z.boolean().nullish(),
    score: z.number().nullish(),
    smtp_provider: zString.nullish(),
    state: z.enum(["deliverable", "undeliverable", "unknown", "risky"]),
    tag: zString.nullish(),
    user: zString.nullish(),
  });
