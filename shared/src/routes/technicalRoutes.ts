import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import {
  validateEmailInputSchema,
  validateEmailResponseSchema,
} from "../email/validateEmail.schema";
import { featureFlagsSchema } from "../featureFlag/featureFlags.schema";
import { withAuthorizationHeaders } from "../headers";
import {
  httpErrorSchema,
  legacyHttpErrorSchema,
} from "../httpClient/httpErrors.schema";
import { brevoInboundBodySchema } from "../inboundEmailParsing/brevoInbound.schema";
import {
  emptyObjectSchema,
  expressEmptyResponseBody,
  zStringMinLength1,
} from "../zodUtils";

const htmlToPdfRequestSchema = z.object({
  htmlContent: zStringMinLength1,
});

// @TODO: This should be a proper OpenAPI schema
const openApiSpecResponseSchema = z.any();

export type TechnicalRoutes = typeof technicalRoutes;

export const technicalRoutes = defineRoutes({
  htmlToPdf: defineRoute({
    method: "post",
    url: "/auth/html-to-pdf",
    ...withAuthorizationHeaders,
    requestBodySchema: htmlToPdfRequestSchema,
    responses: { 200: zStringMinLength1 },
  }),
  openApiSpec: defineRoute({
    method: "get",
    url: "/open-api-spec",
    responses: { 200: openApiSpecResponseSchema },
  }),
  shortLink: defineRoute({
    method: "get",
    url: "/to/:shortLinkId",
    responses: {
      302: emptyObjectSchema,
      404: legacyHttpErrorSchema,
    },
  }),
  featureFlags: defineRoute({
    method: "get",
    url: "/feature-flags",
    responses: { 200: featureFlagsSchema },
  }),
  inboundEmailParsing: defineRoute({
    method: "post",
    url: "/inbound-email-parsing",
    requestBodySchema: brevoInboundBodySchema,
    responses: {
      200: expressEmptyResponseBody,
      400: httpErrorSchema,
      403: emptyObjectSchema,
    },
  }),
  validateEmail: defineRoute({
    method: "get",
    url: "/validate-email",
    queryParamsSchema: validateEmailInputSchema,
    responses: {
      200: validateEmailResponseSchema,
      400: httpErrorSchema,
    },
  }),

  npsValidatedConvention: defineRoute({
    method: "post",
    url: "/nps-validated-convention",
    requestBodySchema: z.any(), // could not find better to not mutate the original object.
    // we need the original object to check the signature
    // validation is still checked in the usecase
    headersSchema: z.object({ "tally-signature": z.string() }).passthrough(),
    responses: {
      201: expressEmptyResponseBody,
      403: legacyHttpErrorSchema,
    },
  }),
});
