import { AbsoluteUrl } from "shared";

export type InclusionConnectGetAccessTokenBody = {
  grant_type: "authorization_code";
  redirect_uri: AbsoluteUrl;
  client_id: string;
  client_secret: string;
  code: string;
};

export type InclusionConnectLogoutQueryParams = {
  state: string;
  id_token_hint: string;
};
