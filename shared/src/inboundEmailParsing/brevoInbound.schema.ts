import { z } from "zod";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type {
  BrevoAttachment,
  BrevoInboundBody,
  BrevoRecipient,
} from "./brevoInbound.dto";

const brevoRecipientSchema: ZodSchemaWithInputMatchingOutput<BrevoRecipient> =
  z.object({
    Name: z.string().nullable(),
    Address: z.string(),
  });

const brevoAttachmentSchema: ZodSchemaWithInputMatchingOutput<BrevoAttachment> =
  z.object({
    Name: z.string(),
    ContentType: z.string(),
    ContentLength: z.number(),
    DownloadToken: z.string(),
  });

export const brevoInboundBodySchema: ZodSchemaWithInputMatchingOutput<BrevoInboundBody> =
  z.object({
    items: z.array(
      z.object({
        Uuid: z.array(z.string()),
        MessageId: z.string(),
        InReplyTo: z.string().nullable(),
        From: brevoRecipientSchema,
        To: z.array(brevoRecipientSchema),
        Cc: z.array(brevoRecipientSchema).nullable(),
        ReplyTo: brevoRecipientSchema.nullable(),
        SentAtDate: z.string(),
        Subject: z.string(),
        Attachments: z.array(brevoAttachmentSchema).nullable(),
        RawHtmlBody: z.string().nullable(),
        RawTextBody: z.string().nullable(),
      }),
    ),
  });
