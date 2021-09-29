export type GetAccessTokenResponse = {
  access_token: string;
};

export interface AccessTokenGateway {
  getAccessToken: (scope: string) => Promise<GetAccessTokenResponse>;
}
