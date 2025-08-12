import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import {
  apiBrevoUrl,
  brevoHeaderBinaryContentSchema,
  brevoHeaderSchema,
} from "../../../../utils/apiBrevoUrl";
import {
  sendTransactEmailRequestBodySchema,
  sendTransactEmailResponseSchema,
  sendTransactSmsRequestBodySchema,
  sendTransactSmsResponseSchema,
} from "./BrevoNotificationGateway.schemas";

export type BrevoNotificationGatewayRoutes =
  typeof brevoNotificationGatewayRoutes;

const brevo400ErrorBodySchema = z.object({
  code: z.string(),
  message: z.string(),
});

export const brevoNotificationGatewayRoutes = defineRoutes({
  sendTransactEmail: defineRoute({
    method: "post",
    url: `${apiBrevoUrl}/smtp/email`,
    headersSchema: brevoHeaderSchema,
    requestBodySchema: sendTransactEmailRequestBodySchema,
    responses: {
      201: sendTransactEmailResponseSchema,
      400: brevo400ErrorBodySchema,
    },
  }),
  sendTransactSms: defineRoute({
    method: "post",
    url: `${apiBrevoUrl}/transactionalSMS/sms`,
    headersSchema: brevoHeaderSchema,
    requestBodySchema: sendTransactSmsRequestBodySchema,
    responses: {
      201: sendTransactSmsResponseSchema,
      400: brevo400ErrorBodySchema,
    },
  }),
  getAttachmentContent: defineRoute({
    method: "get",
    url: `${apiBrevoUrl}/inbound/attachments/:downloadToken`,
    headersSchema: brevoHeaderBinaryContentSchema,
    responses: { 200: z.any() },
  }),
});
