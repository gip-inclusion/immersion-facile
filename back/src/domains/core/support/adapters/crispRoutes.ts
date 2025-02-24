import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";

export type CrispHeaders = z.infer<typeof crispHeadersSchema>;
const crispHeadersSchema = z.object({
  "X-Crisp-Tier": z.literal("plugin"),
  Authorization: z.string(),
  "Content-Type": z.literal("application/json"),
});

const withErrorAndReason = {
  error: z.boolean(),
  reason: z.string(),
};

export type CrispRoutes = typeof crispRoutes;
export const crispRoutes = defineRoutes({
  createConversation: defineRoute({
    method: "post",
    url: "https://api.crisp.chat/v1/website/:websiteId/conversation",
    headersSchema: crispHeadersSchema,
    responses: {
      404: z.object({
        ...withErrorAndReason,
        data: z.object({
          message: z.string(),
        }),
      }),
      201: z.object({
        ...withErrorAndReason,
        data: z.object({
          session_id: z.string(),
        }),
      }),
    },
  }),
  addMessageToConversation: defineRoute({
    method: "post",
    url: "https://api.crisp.chat/v1/website/:websiteId/conversation/:sessionId/message",
    headersSchema: crispHeadersSchema,
    requestBodySchema: z.object({
      type: z.enum(["text", "note"]),
      from: z.literal("user"),
      origin: z.string(),
      content: z.string(),
    }),
    responses: {
      400: z.object({
        ...withErrorAndReason,
        data: z.object({
          message: z.string(),
        }),
      }),
      202: z.object(withErrorAndReason),
    },
  }),
  addMetadataToConversation: defineRoute({
    method: "patch",
    url: "https://api.crisp.chat/v1/website/:websiteId/conversation/:sessionId/meta",
    headersSchema: crispHeadersSchema,
    requestBodySchema: z.object({
      nickname: z.string().optional(),
      email: z.string(),
      segments: z.array(z.string()),
      subject: z.string().optional(),
    }),
    responses: {
      400: z.any(),
      200: z.object(withErrorAndReason),
    },
  }),
});
