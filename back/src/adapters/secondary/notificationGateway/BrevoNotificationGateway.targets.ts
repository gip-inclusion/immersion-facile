import { AbsoluteUrl } from "shared";
import { createTarget, createTargets } from "http-client";
import { createLogger } from "../../../utils/logger";
import { validateAndParseZodSchema } from "../../primary/helpers/httpErrors";
import {
  brevoHeaderBinaryContentSchema,
  brevoHeaderSchema,
  sendTransactEmailRequestBodySchema,
  sendTransactEmailResponseSchema,
  sendTransactSmsRequestBodySchema,
  sendTransactSmsResponseSchema,
} from "./BrevoNotificationGateway.schemas";

export type BrevoNotificationGatewayTargets =
  typeof brevoNotificationGatewayTargets;

const apiBrevoUrl: AbsoluteUrl = "https://api.brevo.com/v3";

const logger = createLogger(__filename);
export const brevoNotificationGatewayTargets = createTargets({
  sendTransactEmail: createTarget({
    method: "POST",
    url: `${apiBrevoUrl}/smtp/email`,
    validateHeaders: brevoHeaderSchema.parse,
    validateRequestBody: sendTransactEmailRequestBodySchema.parse,
    validateResponseBody: (responseBody) =>
      validateAndParseZodSchema(
        sendTransactEmailResponseSchema,
        responseBody,
        logger,
      ),
  }),
  sendTransactSms: createTarget({
    method: "POST",
    url: `${apiBrevoUrl}/transactionalSMS/sms`,
    validateHeaders: brevoHeaderSchema.parse,
    validateRequestBody: sendTransactSmsRequestBodySchema.parse,
    validateResponseBody: (responseBody) =>
      validateAndParseZodSchema(
        sendTransactSmsResponseSchema,
        responseBody,
        logger,
      ),
  }),
  getAttachmentContent: createTarget({
    method: "GET",
    url: `${apiBrevoUrl}/inbound/attachments/:downloadToken`,
    responseType: "arraybuffer",
    validateHeaders: brevoHeaderBinaryContentSchema.parse,
    validateResponseBody: (responseBody) => responseBody as Buffer,
  }),
});
