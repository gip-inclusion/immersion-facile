import { AbsoluteUrl } from "shared";
import { createTarget, createTargets } from "http-client";
import { createLogger } from "../../../utils/logger";
import { validateAndParseZodSchema } from "../../primary/helpers/httpErrors";
import {
  sendTransactEmailHeaderSchema,
  sendTransactEmailRequestBodySchema,
  sendTransactEmailResponseSchema,
  sendTransactSmsHeaderSchema,
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
    validateHeaders: sendTransactEmailHeaderSchema.parse,
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
    validateHeaders: sendTransactSmsHeaderSchema.parse,
    validateRequestBody: sendTransactSmsRequestBodySchema.parse,
    validateResponseBody: (responseBody) =>
      validateAndParseZodSchema(
        sendTransactSmsResponseSchema,
        responseBody,
        logger,
      ),
  }),
});
