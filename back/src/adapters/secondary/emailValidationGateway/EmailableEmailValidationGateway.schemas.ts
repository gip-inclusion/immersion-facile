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
    accept_all: z.boolean().optional(),
    did_you_mean: zString.or(z.null()).optional(),
    disposable: z.boolean().optional(),
    domain: zString,
    duration: z.number(),
    email: zString,
    first_name: zString.or(z.null()),
    free: z.boolean(),
    full_name: zString.or(z.null()),
    gender: zString.or(z.null()),
    last_name: zString.or(z.null()),
    mailbox_full: z.boolean(),
    mx_record: zString,
    no_reply: z.boolean(),
    reason: validateEmailReasonSchema,
    role: z.boolean(),
    score: z.number(),
    smtp_provider: zString.or(z.null()),
    state: z.enum(["deliverable", "undeliverable", "unknown", "risky"]),
    tag: zString.or(z.null()),
    user: zString,
  });
