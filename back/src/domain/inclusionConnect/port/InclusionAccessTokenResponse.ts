import { z } from "zod";

// see documentation : https://github.com/betagouv/itou-inclusion-connect/blob/master/docs/openid_connect.md

// id_token is a jwt that has a payload of kind : InclusionAccessTokenResponse
// access_token could be used to call UserInfo endpoint

export type InclusionAccessTokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  id_token: string;
};

export const inclusionAccessTokenResponseSchema: z.Schema<InclusionAccessTokenResponse> =
  z.object({
    access_token: z.string(),
    token_type: z.enum(["Bearer"]),
    expires_in: z.number(),
    id_token: z.string(),
  });
