import {
  type ConnectedUserJwt,
  type ConnectedUserQueryParams,
  decodeURIWithParams,
  filterNotFalsy,
  makeRouteAbsoluteUrl,
  queryParamsAsString,
  routes,
} from "shared";
import type {
  ConventionMagicLinkLifetime,
  GenerateConnectedUserLoginUrl,
  GenerateConventionMagicLinkRouteName,
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
  lifetime = "1Month",
  extraQueryParams = {},
}: CreateConventionMagicLinkPayloadProperties & {
  extraQueryParams?: Record<string, string>;
  targetRoute: GenerateConventionMagicLinkRouteName;
  lifetime?: ConventionMagicLinkLifetime;
}) => {
  const fakeJwt = [id, role, now.toISOString(), email, lifetime]
    .filter(filterNotFalsy)
    .join("/");

  return makeRouteAbsoluteUrl(
    routes[targetRoute]({
      ...extraQueryParams,
      jwt: fakeJwt,
    }),
    "http://fake-magic-link",
  );
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
  targetRoute,
}) =>
  makeRouteAbsoluteUrl(
    routes[targetRoute]({
      code: "EmailAuthCodeJwt",
      email,
      state,
    }),
    "http://fake-connected-user",
  );
