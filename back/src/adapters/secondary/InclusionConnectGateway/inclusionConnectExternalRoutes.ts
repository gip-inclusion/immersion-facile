import { z } from "zod";
import { AbsoluteUrl } from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { inclusionAccessTokenResponseSchema } from "../../../domain/inclusionConnect/port/InclusionAccessTokenResponse";

const withContentTypeUrlEncodedSchema = z.object({
  "Content-Type": z.literal("application/x-www-form-urlencoded"),
});

const inclusionConnectLogoutQueryParamsSchema = z.object({
  state: z.string(),
  id_token_hint: z.string(),
});

export type InclusionConnectExternalRoutes = ReturnType<
  typeof makeInclusionConnectExternalRoutes
>;

export const makeInclusionConnectExternalRoutes = (
  inclusionConnectBaseUrl: AbsoluteUrl,
) =>
  defineRoutes({
    // url should be of form: "https://{hostname}/realms/{realm-name}/protocol/openid-connect" then we add auth | token | logout,
    inclusionConnectGetAccessToken: defineRoute({
      method: "post",
      url: `${inclusionConnectBaseUrl}/token`,
      requestBodySchema: z.string(),
      headersSchema: withContentTypeUrlEncodedSchema.passthrough(),
      responses: { 200: inclusionAccessTokenResponseSchema },
    }),
    inclusionConnectLogout: defineRoute({
      method: "get",
      url: `${inclusionConnectBaseUrl}/logout`,
      queryParamsSchema: inclusionConnectLogoutQueryParamsSchema,
    }),
  });
