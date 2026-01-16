import {
  type AbsoluteUrl,
  type ConnectedUserQueryParams,
  type CreateConventionMagicLinkPayloadProperties,
  currentJwtVersions,
  decodeURIWithParams,
  type OmitFromExistingKeys,
  queryParamsAsString,
  TWELVE_HOURS_IN_SECONDS,
  type User,
} from "shared";
import type { OngoingOAuth } from "../../domains/core/authentication/connected-user/entities/OngoingOAuth";
import type { GetAccessTokenResult } from "../../domains/core/authentication/connected-user/port/OAuthGateway";
import type {
  GenerateConnectedUserJwt,
  GenerateConventionJwt,
} from "../../domains/core/jwt";
import { createConventionMagicLinkPayload } from "../../utils/jwt";
import type { AppConfig } from "./appConfig";

export type GenerateConventionMagicLinkUrl = ReturnType<
  typeof makeGenerateConventionMagicLinkUrl
>;

export const makeGenerateConventionMagicLinkUrl =
  (config: AppConfig, generateJwt: GenerateConventionJwt) =>
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
    const jwt = generateJwt(
      createConventionMagicLinkPayload({
        ...jwtPayload,
        durationDays:
          lifetime === "short"
            ? config.magicLinkShortDurationInDays
            : config.magicLinkLongDurationInDays,
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
};

export const makeGenerateConnectedUserLoginUrl =
  (config: AppConfig, generateConnectedUserJwt: GenerateConnectedUserJwt) =>
  ({
    user,
    accessToken,
    ongoingOAuth,
  }: GenerateConnectedUserLoginUrlParams): AbsoluteUrl => {
    const { uriWithoutParams, params } = decodeURIWithParams(
      ongoingOAuth.fromUri,
    );

    return `${config.immersionFacileBaseUrl}${uriWithoutParams}?${queryParamsAsString<ConnectedUserQueryParams>(
      {
        ...params,
        token: generateConnectedUserJwt(
          {
            userId: user.id,
            version: currentJwtVersions.connectedUser,
          },
          TWELVE_HOURS_IN_SECONDS,
        ),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        idToken: accessToken?.idToken ?? "",
        provider: ongoingOAuth.provider,
      },
    )}`;
  };
