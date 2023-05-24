import { z } from "zod";
import { AbsoluteUrl, absoluteUrlSchema, Flavor, zEmail } from "shared";
import { Phone } from "../../../domain/convention/ports/NotificationGateway";

export type ApiKey = Flavor<string, "ApiKey">;
const apiKeySchema = z.string().nonempty();

type ApplicationJsonType = "application/json";
const applicationJsonSchema = z.literal("application/json");

export type BrevoHeaders = {
  accept: ApplicationJsonType;
  "content-type": ApplicationJsonType;
  "api-key": ApiKey;
};

export const brevoHeaderSchema: z.Schema<BrevoHeaders> = z.object({
  accept: applicationJsonSchema,
  "content-type": applicationJsonSchema,
  "api-key": apiKeySchema,
});

export type RecipientOrSender = {
  name?: string;
  email: string;
};
const recipientOrSenderSchema: z.Schema<RecipientOrSender> = z.object({
  name: z.string().optional(),
  email: zEmail,
});

type Attachement = { url: string };
const attachementSchema: z.Schema<Attachement> = z.object({
  url: z.string(),
});

export type SendTransactEmailRequestBody = {
  to: RecipientOrSender[];
  cc?: RecipientOrSender[];
  htmlContent: string;
  sender: RecipientOrSender;
  subject: string;
  tags?: string[];
  attachment?: Attachement[];
};

export const sendTransactEmailRequestBodySchema: z.Schema<SendTransactEmailRequestBody> =
  z.object({
    to: z.array(recipientOrSenderSchema),
    cc: z.array(recipientOrSenderSchema).optional(),
    htmlContent: z.string(),
    sender: recipientOrSenderSchema,
    subject: z.string(),
    tags: z.array(z.string()).optional(),
    attachment: z.array(attachementSchema).optional(),
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

//Mobile number to send SMS with the country code - Limited on this gateway to allow only french mobile phones
const brevoSmsRecipientSchema: z.Schema<Phone> = z
  .string()
  .refine(
    (recipient) =>
      (recipient.startsWith("336") || recipient.startsWith("337")) &&
      recipient.length === 11,
    "The phone number must be a french international mobile phone like '33611223344'",
  );

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
    recipient: brevoSmsRecipientSchema,
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
