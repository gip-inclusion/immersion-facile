import { createTarget, createTargets } from "http-client";
import { validateAndParseZodSchema } from "../../primary/helpers/httpErrors";
import {
  sendTransactEmailHeaderSchema,
  sendTransactEmailRequestBodySchema,
  sendTransactEmailResponseSchema,
} from "./SendinblueHtmlEmailGateway.schemas";

export type SendinblueHtmlEmailGatewayTargets =
  typeof sendinblueHtmlEmailGatewayTargets;

export const sendinblueHtmlEmailGatewayTargets = createTargets({
  sendTransactEmail: createTarget({
    method: "POST",
    url: `https://api.sendinblue.com/v3/smtp/email`,
    validateHeaders: sendTransactEmailHeaderSchema.parse,
    validateRequestBody: sendTransactEmailRequestBodySchema.parse,
    validateResponseBody: (responseBody) =>
      validateAndParseZodSchema(sendTransactEmailResponseSchema, responseBody),
  }),
});
