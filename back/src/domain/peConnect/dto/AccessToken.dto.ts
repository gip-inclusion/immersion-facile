export type AccessTokenDto = {
  value: string;
  expiresIn: number;
};

export const toAccessToken = (
  externalAccessToken: ExternalAccessToken,
): AccessTokenDto => ({
  value: externalAccessToken.access_token,
  expiresIn: externalAccessToken.expires_in,
});

export type ExternalAccessToken = {
  access_token: string;
  expires_in: number;
};
