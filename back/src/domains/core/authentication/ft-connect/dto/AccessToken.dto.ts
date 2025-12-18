import type { IdToken } from "shared";

export type AccessTokenDto = {
  value: string;
  expiresIn: number;
  idToken: IdToken;
};
