import {
  AbsoluteUrl,
  EmailAttachment,
  Phone,
  absoluteUrlSchema,
  emailAttachmentSchema,
  emailSchema,
  smsRecipientPhoneSchema,
} from "shared";
import { z } from "zod";

export type RecipientOrSender = {
  name?: string;
  email: string;
};
const recipientOrSenderSchema: z.Schema<RecipientOrSender> = z.object({
  name: z.string().optional(),
  email: emailSchema,
});

export type SendTransactEmailRequestBody = {
  to: RecipientOrSender[];
  cc?: RecipientOrSender[];
  replyTo?: RecipientOrSender;
  htmlContent: string;
  sender: RecipientOrSender;
  subject: string;
  tags?: string[];
  attachment?: EmailAttachment[];
};

export const sendTransactEmailRequestBodySchema: z.Schema<SendTransactEmailRequestBody> =
  z.object({
    to: z.array(recipientOrSenderSchema),
    replyTo: recipientOrSenderSchema.optional(),
    cc: z.array(recipientOrSenderSchema).optional(),
    htmlContent: z.string(),
    sender: recipientOrSenderSchema,
    subject: z.string(),
    tags: z.array(z.string()).optional(),
    attachment: z.array(emailAttachmentSchema).optional(),
  });

type SendTransactEmailResponseBody =
  | {
      messageId: string;
    }
  | {
      messageIds: string[];
    };

export const sendTransactEmailResponseSchema: z.Schema<SendTransactEmailResponseBody> =
  z
    .object({
      messageId: z.string(),
    })
    .or(
      z.object({
        messageIds: z.array(z.string()),
      }),
    );

export type SendTransactSmsRequestBody = {
  sender: string;
  recipient: Phone;
  content: string;
  type?: "transactional" | "marketing";
  tag?: string;
  organisationPrefix?: string;
  webUrl?: AbsoluteUrl;
  unicodeEnabled?: boolean;
};

const brevoSmsSenderSchema: z.Schema<string> = z
  .string()
  .refine(
    (sender) =>
      ((/^[a-zA-Z0-9]+$/.test(sender) && sender.length <= 11) ||
        (/^[0-9]+$/.test(sender) && sender.length <= 15)) &&
      sender.length > 0,
    {
      message:
        "Invalid sender. It must have a maximum of 11 alphanumeric characters or a maximum of 15 numeric characters.",
    },
  );

export const sendTransactSmsRequestBodySchema: z.Schema<SendTransactSmsRequestBody> =
  z.object({
    sender: brevoSmsSenderSchema,
    recipient: smsRecipientPhoneSchema,
    content: z.string(),
    type: z.enum(["transactional", "marketing"]).optional(),
    tag: z.string().optional(),
    organisationPrefix: z.string().optional(),
    webUrl: absoluteUrlSchema.optional(),
    unicodeEnabled: z.boolean().optional(),
  });

type SendTransactSmsResponseBody = {
  reference: string;
  messageId: number;
  smsCount?: number;
  usedCredits?: number;
  remainingCredits?: number;
};

export const sendTransactSmsResponseSchema: z.Schema<SendTransactSmsResponseBody> =
  z.object({
    reference: z.string(),
    messageId: z.number(),
    smsCount: z.number().optional(),
    usedCredits: z.number().optional(),
    remainingCredits: z.number().optional(),
  });
