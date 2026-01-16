import {
  type AbsoluteUrl,
  type ConnectedUserQueryParams,
  decodeURIWithParams,
  type Email,
  type OAuthSuccessLoginParams,
  type OmitFromExistingKeys,
  queryParamsAsString,
  type User,
} from "shared";
import type { OngoingOAuth } from "../../domains/core/authentication/connected-user/entities/OngoingOAuth";
import type { GetAccessTokenResult } from "../../domains/core/authentication/connected-user/port/OAuthGateway";
import type {
  GenerateConnectedUserJwt,
  GenerateConventionJwt,
  GenerateEmailAuthCodeJwt,
} from "../../domains/core/jwt";
import {
  type CreateConventionMagicLinkPayloadProperties,
  createConnectedUserJwtPayload,
  createConventionMagicLinkPayload,
  createEmailAuthCodeJwtPayload,
} from "../../utils/jwt";
import type { AppConfig } from "./appConfig";

export type GenerateConventionMagicLinkUrl = ReturnType<
  typeof makeGenerateConventionMagicLinkUrl
>;

export const makeGenerateConventionMagicLinkUrl =
  (config: AppConfig, generateConventionJwt: GenerateConventionJwt) =>
  ({
    targetRoute,
    lifetime = "short",
    extraQueryParams = {},
    ...jwtPayload
  }: OmitFromExistingKeys<
    CreateConventionMagicLinkPayloadProperties,
    "durationDays"
  > & {
    extraQueryParams?: Record<string, string>;
    targetRoute: string;
    lifetime?: "short" | "long";
  }): AbsoluteUrl => {
    const jwt = generateConventionJwt(
      createConventionMagicLinkPayload({
        ...jwtPayload,
        durationDays:
          lifetime === "short"
            ? config.conventionJwtShortDurationInDays
            : config.conventionJwtLongDurationInDays,
      }),
    );

    const queryParams = new URLSearchParams({
      ...extraQueryParams,
      jwt,
    });

    return `${config.immersionFacileBaseUrl}/${targetRoute}?${queryParams}`;
  };

export type GenerateConnectedUserLoginUrl = ReturnType<
  typeof makeGenerateConnectedUserLoginUrl
>;

export type GenerateConnectedUserLoginUrlParams = {
  user: User;
  accessToken: GetAccessTokenResult | undefined;
  ongoingOAuth: OngoingOAuth;
  now: Date;
};

export const makeGenerateConnectedUserLoginUrl =
  (config: AppConfig, generateConnectedUserJwt: GenerateConnectedUserJwt) =>
  ({
    user,
    accessToken,
    ongoingOAuth,
    now,
  }: GenerateConnectedUserLoginUrlParams): AbsoluteUrl => {
    const { uriWithoutParams, params } = decodeURIWithParams(
      ongoingOAuth.fromUri,
    );

    const jwt = generateConnectedUserJwt(
      createConnectedUserJwtPayload({
        userId: user.id,
        now,
        durationHours: config.connectedUserJwtDurationInHours,
      }),
    );

    const queryParams = queryParamsAsString<ConnectedUserQueryParams>({
      ...params,
      token: jwt,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      idToken: accessToken?.idToken ?? "",
      provider: ongoingOAuth.provider,
    });

    return `${config.immersionFacileBaseUrl}${uriWithoutParams}?${queryParams}`;
  };

export type GenerateEmailAuthCodeUrl = ReturnType<
  typeof makeGenerateEmailAuthCodeUrl
>;

export type GenerateEmailAuthCodeUrlParams = {
  uri: string;
  state: string;
  email: Email;
  now: Date;
};

export type EmailAuthCodeUrlQueryParams = OAuthSuccessLoginParams & {
  email: Email;
};

export const makeGenerateEmailAuthCodeUrl =
  (config: AppConfig, generateEmailAuthCodeJwt: GenerateEmailAuthCodeJwt) =>
  ({ email, state, uri, now }: GenerateEmailAuthCodeUrlParams): AbsoluteUrl => {
    const jwt = generateEmailAuthCodeJwt(
      createEmailAuthCodeJwtPayload({
        now,
        durationMinutes: config.emailAuthCodeJwtDurationInMinutes,
        emailAuthCode: true,
      }),
    );

    const queryParams = queryParamsAsString<EmailAuthCodeUrlQueryParams>({
      code: jwt,
      state,
      email,
    });

    return `${config.immersionFacileBaseUrl}/${uri}?${queryParams}`;
  };
