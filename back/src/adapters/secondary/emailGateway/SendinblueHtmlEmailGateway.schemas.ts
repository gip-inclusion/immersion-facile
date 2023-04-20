import { z } from "zod";
import { Flavor, zEmail } from "shared";

export type ApiKey = Flavor<string, "ApiKey">;
const apiKeySchema = z.string().nonempty();

type ApplicationJsonType = "application/json";
const applicationJsonSchema = z.literal("application/json");

export type SendTransactEmailHeader = {
  accept: ApplicationJsonType;
  "content-type": ApplicationJsonType;
  "api-key": ApiKey;
};

export const sendTransactEmailHeaderSchema: z.Schema<SendTransactEmailHeader> =
  z.object({
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
