import { AbsoluteUrl } from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";

// see documentation : https://github.com/betagouv/itou-inclusion-connect/blob/master/docs/openid_connect.md

// id_token is a jwt that has a payload of kind : InclusionAccessTokenResponse
// access_token could be used to call UserInfo endpoint

export type InclusionConnectAccessTokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  id_token: string;
};

const inclusionConnectAccessTokenResponseSchema: z.Schema<InclusionConnectAccessTokenResponse> =
  z.object({
    access_token: z.string(),
    token_type: z.enum(["Bearer"]),
    expires_in: z.number(),
    id_token: z.string(),
  });

const withContentTypeUrlEncodedSchema = z.object({
  "Content-Type": z.literal("application/x-www-form-urlencoded"),
});

export type InclusionConnectLogoutQueryParams = {
  client_id: string;
  post_logout_redirect_uri: AbsoluteUrl;
};

export type InclusionConnectRoutes = ReturnType<
  typeof makeInclusionConnectRoutes
>;

export const makeInclusionConnectRoutes = (
  inclusionConnectBaseUrl: AbsoluteUrl,
) =>
  defineRoutes({
    // url should be of form: "https://{hostname}/auth" then we add  /token | /logout,
    // documentation is here : https://github.com/gip-inclusion/inclusion-connect/blob/main/docs/inclusion_connect.md
    getAccessToken: defineRoute({
      method: "post",
      url: `${inclusionConnectBaseUrl}/token/`,
      requestBodySchema: z.string(),
      headersSchema: withContentTypeUrlEncodedSchema.passthrough(),
      responses: { 200: inclusionConnectAccessTokenResponseSchema },
    }),
  });
