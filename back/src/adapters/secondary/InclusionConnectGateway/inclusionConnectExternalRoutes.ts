import { z } from "zod";
import { AbsoluteUrl } from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { inclusionAccessTokenResponseSchema } from "../../../domain/inclusionConnect/port/InclusionAccessTokenResponse";

const withContentTypeUrlEncodedSchema = z.object({
  "Content-Type": z.literal("application/x-www-form-urlencoded"),
});

export type InclusionConnectLogoutQueryParams = {
  client_id: string;
  post_logout_redirect_uri: AbsoluteUrl;
};

export type InclusionConnectExternalRoutes = ReturnType<
  typeof makeInclusionConnectExternalRoutes
>;

export const makeInclusionConnectExternalRoutes = (
  inclusionConnectBaseUrl: AbsoluteUrl,
) =>
  defineRoutes({
    // url should be of form: "https://{hostname}/auth" then we add  /token | /logout,
    // documentation is here : https://github.com/gip-inclusion/inclusion-connect/blob/main/docs/inclusion_connect.md
    inclusionConnectGetAccessToken: defineRoute({
      method: "post",
      url: `${inclusionConnectBaseUrl}/token/`,
      requestBodySchema: z.string(),
      headersSchema: withContentTypeUrlEncodedSchema.passthrough(),
      responses: { 200: inclusionAccessTokenResponseSchema },
    }),
  });
