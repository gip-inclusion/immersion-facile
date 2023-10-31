import { z } from "zod";
import { AbsoluteUrl } from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import {
  brevoHeaderBinaryContentSchema,
  brevoHeaderSchema,
  sendTransactEmailRequestBodySchema,
  sendTransactEmailResponseSchema,
  sendTransactSmsRequestBodySchema,
  sendTransactSmsResponseSchema,
} from "./BrevoNotificationGateway.schemas";

export type BrevoNotificationGatewayRoutes =
  typeof brevoNotificationGatewayRoutes;

const apiBrevoUrl: AbsoluteUrl = "https://api.sendinblue.com/v3";

export const brevoNotificationGatewayRoutes = defineRoutes({
  sendTransactEmail: defineRoute({
    method: "post",
    url: `${apiBrevoUrl}/smtp/email`,
    headersSchema: brevoHeaderSchema,
    requestBodySchema: sendTransactEmailRequestBodySchema,
    responses: {
      200: sendTransactEmailResponseSchema,
    },
  }),
  sendTransactSms: defineRoute({
    method: "post",
    url: `${apiBrevoUrl}/transactionalSMS/sms`,
    headersSchema: brevoHeaderSchema,
    requestBodySchema: sendTransactSmsRequestBodySchema,
    responses: {
      200: sendTransactSmsResponseSchema,
    },
  }),
  getAttachmentContent: defineRoute({
    method: "get",
    url: `${apiBrevoUrl}/inbound/attachments/:downloadToken`,
    responseType: "arrayBuffer",
    headersSchema: brevoHeaderBinaryContentSchema,
    responses: { 200: z.any() },
  }),
});
