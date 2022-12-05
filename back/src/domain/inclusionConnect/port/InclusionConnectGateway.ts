import { z } from "zod";

export type InclusionAccessTokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  id_token: string;
};

export type InclusionConnectIdTokenPayload = {
  nonce: string;
  sub: string;
  given_name: string;
  family_name: string;
  email: string;
};

export const inclusionAccessTokenResponseSchema: z.Schema<InclusionAccessTokenResponse> =
  z.object({
    access_token: z.string(),
    token_type: z.enum(["Bearer"]),
    expires_in: z.number(),
    id_token: z.string(),
  });

export interface InclusionConnectGateway {
  getAccessToken: (code: string) => Promise<InclusionAccessTokenResponse>;
}
