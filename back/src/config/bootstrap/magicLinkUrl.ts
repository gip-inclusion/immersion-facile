import {
  type AbsoluteUrl,
  type ConnectedUserQueryParams,
  decodeURIWithParams,
  type Email,
  type FrontRouteKeys,
  frontRoutes,
  makeRouteAbsoluteUrl,
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

export type ConventionMagicLinkLifetime = "1Month" | "2Days";

export type GenerateConventionMagicLinkRouteName = Extract<
  FrontRouteKeys,
  | "conventionImmersion"
  | "conventionToSign"
  | "unregisterEstablishmentLead"
  | "assessment"
  | "assessmentDocument"
  | "conventionDocument"
  | "manageConvention"
>;

export const makeGenerateConventionMagicLinkUrl =
  (config: AppConfig, generateConventionJwt: GenerateConventionJwt) =>
  ({
    targetRoute,
    lifetime = "1Month",
    extraQueryParams = {},
    ...jwtPayload
  }: OmitFromExistingKeys<
    CreateConventionMagicLinkPayloadProperties,
    "durationDays"
  > & {
    extraQueryParams?: Record<string, string>;
    targetRoute: GenerateConventionMagicLinkRouteName;
    lifetime?: ConventionMagicLinkLifetime;
  }): AbsoluteUrl => {
    const durationDaysByLifetime = {
      "2Days": config.conventionJwtTwoDaysDuration,
      "1Month": config.conventionJwt1MonthDurationInDays,
    };

    const jwt = generateConventionJwt(
      createConventionMagicLinkPayload({
        ...jwtPayload,
        durationDays: durationDaysByLifetime[lifetime],
      }),
    );

    return makeRouteAbsoluteUrl({
      route: frontRoutes[targetRoute]({
        ...extraQueryParams,
        jwt,
      }),
      baseUrl: config.immersionFacileBaseUrl,
    });
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
  targetRoute: Extract<FrontRouteKeys, "magicLinkInterstitial">;
  state: string;
  email: Email;
  now: Date;
};

export type EmailAuthCodeUrlQueryParams = OAuthSuccessLoginParams & {
  email: Email;
};

export const makeGenerateEmailAuthCodeUrl =
  (config: AppConfig, generateEmailAuthCodeJwt: GenerateEmailAuthCodeJwt) =>
  ({
    email,
    state,
    targetRoute,
    now,
  }: GenerateEmailAuthCodeUrlParams): AbsoluteUrl => {
    const jwt = generateEmailAuthCodeJwt(
      createEmailAuthCodeJwtPayload({
        now,
        durationMinutes: config.emailAuthCodeJwtDurationInMinutes,
        emailAuthCode: true,
      }),
    );

    return makeRouteAbsoluteUrl({
      route: frontRoutes[targetRoute]({
        code: jwt,
        email,
        state,
      }),
      baseUrl: config.immersionFacileBaseUrl,
    });
  };
