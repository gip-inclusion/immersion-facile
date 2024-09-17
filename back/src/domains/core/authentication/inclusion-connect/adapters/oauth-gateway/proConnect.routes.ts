import { AbsoluteUrl, withAuthorizationHeaders } from "shared";
import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";

// see documentation : https://github.com/betagouv/itou-inclusion-connect/blob/master/docs/openid_connect.md

// id_token is a jwt that has a payload of kind : InclusionAccessTokenResponse
// access_token could be used to call UserInfo endpoint

type ProConnectAccessTokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  id_token: string;
};

const proConnectAccessTokenResponseSchema: z.Schema<ProConnectAccessTokenResponse> =
  z.object({
    access_token: z.string(),
    token_type: z.enum(["Bearer"]),
    expires_in: z.number(),
    id_token: z.string(),
  });

const withContentTypeUrlEncodedSchema = z.object({
  "Content-Type": z.literal("application/x-www-form-urlencoded"),
});

export type ProConnectLogoutQueryParams = {
  post_logout_redirect_uri: AbsoluteUrl;
  id_token_hint: string;
  state: string;
};

export type ProConnectRoutes = ReturnType<typeof makeProConnectRoutes>;

export const makeProConnectRoutes = (proConnectBaseUrl: AbsoluteUrl) =>
  defineRoutes({
    getAccessToken: defineRoute({
      method: "post",
      url: `${proConnectBaseUrl}/token`,
      requestBodySchema: z.string(),
      headersSchema: withContentTypeUrlEncodedSchema.passthrough(),
      responses: { 200: proConnectAccessTokenResponseSchema },
    }),
    getUserInfo: defineRoute({
      method: "get",
      url: `${proConnectBaseUrl}/userinfo`,
      ...withAuthorizationHeaders,
      responses: {
        200: z.string(),
        400: z.any(),
      },
    }),
  });
