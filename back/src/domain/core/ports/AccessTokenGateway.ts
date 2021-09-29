// Described in
// https://pole-emploi.io/data/documentation/utilisation-api-pole-emploi/generer-access-token
export type GetAccessTokenResponse = {
  access_token: string;
  expires_in: number;
};

export interface AccessTokenGateway {
  getAccessToken: (scope: string) => Promise<GetAccessTokenResponse>;
}
