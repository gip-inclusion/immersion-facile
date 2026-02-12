import {
  type AbsoluteUrl,
  type ConnectedUserJwt,
  type ConnectedUserQueryParams,
  decodeURIWithParams,
  filterNotFalsy,
  queryParamsAsString,
} from "shared";
import type {
  ConventionMagicLinkLifetime,
  EmailAuthCodeUrlQueryParams,
  GenerateConnectedUserLoginUrl,
  GenerateConventionMagicLinkUrl,
  GenerateEmailAuthCodeUrl,
} from "../config/bootstrap/magicLinkUrl";
import type { GenerateApiConsumerJwt } from "../domains/core/jwt";
import type { CreateConventionMagicLinkPayloadProperties } from "./jwt";

export const generateApiConsumerJwtTestFn: GenerateApiConsumerJwt = ({
  id,
  iat,
  version,
}) => `FAKE-API-CONSUMER-JWT-${id}-version-${version}-iat-${iat}`;

export const fakeGenerateMagicLinkUrlFn: GenerateConventionMagicLinkUrl = ({
  email,
  id,
  now,
  role,
  targetRoute,
  lifetime = "short",
  extraQueryParams = {},
}: CreateConventionMagicLinkPayloadProperties & {
  extraQueryParams?: Record<string, string>;
  targetRoute: string;
  lifetime?: ConventionMagicLinkLifetime;
}) => {
  const fakeJwt = [id, role, now.toISOString(), email, lifetime]
    .filter(filterNotFalsy)
    .join("/");

  const queryParams = Object.entries(extraQueryParams).map(
    ([key, value]) => `${key}=${value}`,
  );
  return [
    "http://fake-magic-link",
    targetRoute,
    fakeJwt,
    ...(queryParams.length ? [queryParams.join("&")] : []),
  ].join("/") as AbsoluteUrl;
};

export const fakeGenerateConnectedUserUrlFn: GenerateConnectedUserLoginUrl = ({
  accessToken,
  user,
  ongoingOAuth,
}) => {
  const { uriWithoutParams, params } = decodeURIWithParams(
    ongoingOAuth.fromUri,
  );

  return `${"http://fake-connected-user"}${uriWithoutParams}?${queryParamsAsString<ConnectedUserQueryParams>(
    {
      ...params,
      token: user.id as ConnectedUserJwt,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      idToken: accessToken?.idToken ?? "",
      provider: ongoingOAuth.provider,
    },
  )}`;
};

export const fakeGenerateEmailAuthCodeUrlFn: GenerateEmailAuthCodeUrl = ({
  email,
  state,
  uri,
}) =>
  `http://fake-connected-user/${uri}?${queryParamsAsString<EmailAuthCodeUrlQueryParams>(
    {
      code: "EmailAuthCodeJwt",
      email,
      state,
    },
  )}`;
