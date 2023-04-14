import { z } from "zod";
import { AbsoluteUrl } from "shared";
import { createTarget, createTargets } from "http-client";
import { inclusionAccessTokenResponseSchema } from "../../../domain/inclusionConnect/port/InclusionAccessTokenResponse";

const withContentTypeUrlEncodedSchema = z.object({
  "Content-Type": z.literal("application/x-www-form-urlencoded"),
});

const inclusionConnectLogoutQueryParamsSchema = z.object({
  state: z.string(),
  id_token_hint: z.string(),
});

export type InclusionConnectExternalTargets = ReturnType<
  typeof makeInclusionConnectExternalTargets
>;

export const makeInclusionConnectExternalTargets = (
  inclusionConnectBaseUrl: AbsoluteUrl,
) =>
  createTargets({
    // url should be of form: "https://{hostname}/realms/{realm-name}/protocol/openid-connect" then we add auth | token | logout,
    inclusionConnectGetAccessToken: createTarget({
      method: "POST",
      url: `${inclusionConnectBaseUrl}/token`,
      validateHeaders: withContentTypeUrlEncodedSchema.passthrough().parse,
      validateRequestBody: z.string().parse,
      validateResponseBody: inclusionAccessTokenResponseSchema.parse,
    }),
    inclusionConnectLogout: createTarget({
      method: "GET",
      url: `${inclusionConnectBaseUrl}/logout`,
      validateQueryParams: inclusionConnectLogoutQueryParamsSchema.parse,
    }),
  });
