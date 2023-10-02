import { z } from "zod";
import {
  BrevoAttachment,
  BrevoInboundBody,
  BrevoRecipient,
} from "./brevoInbound.dto";

const brevoRecipientSchema: z.Schema<BrevoRecipient> = z.object({
  Name: z.string().nullable(),
  Address: z.string(),
});

const brevoAttachmentSchema: z.Schema<BrevoAttachment> = z.object({
  Name: z.string(),
  ContentType: z.string(),
  ContentLength: z.number(),
  ContentID: z.string(),
  DownloadToken: z.string(),
});

export const brevoInboundBodySchema: z.Schema<BrevoInboundBody> = z.object({
  items: z.array(
    z.object({
      Uuid: z.array(z.string()),
      MessageId: z.string(),
      InReplyTo: z.string().nullable(),
      From: brevoRecipientSchema,
      To: z.array(brevoRecipientSchema),
      Cc: z.array(brevoRecipientSchema),
      ReplyTo: brevoRecipientSchema.nullable(),
      SentAtDate: z.string(),
      Subject: z.string(),
      Attachments: z.array(brevoAttachmentSchema),
      RawHtmlBody: z.string().nullable(),
      RawTextBody: z.string().nullable(),
    }),
  ),
});
