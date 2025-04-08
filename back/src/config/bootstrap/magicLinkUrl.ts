import { identity } from "ramda";
import {
  type AbsoluteUrl,
  type CreateConventionMagicLinkPayloadProperties,
  type EstablishmentDashboardTab,
  type InclusionConnectJwtPayload,
  type OmitFromExistingKeys,
  createConventionMagicLinkPayload,
  frontRoutes,
} from "shared";
import type {
  GenerateConventionJwt,
  GenerateInclusionConnectJwt,
} from "../../domains/core/jwt";
import type { AppConfig } from "./appConfig";

export const generateEditFormEstablishmentUrl = (
  immersionFacileBaseUrl: AbsoluteUrl,
  generateInclusionConnectJwt: GenerateInclusionConnectJwt,
  payload: InclusionConnectJwtPayload,
): AbsoluteUrl =>
  `${immersionFacileBaseUrl}/${
    frontRoutes.establishmentDashboard
  }/${identity<EstablishmentDashboardTab>("fiche-entreprise")}?jwt=${generateInclusionConnectJwt(payload)}`;

export type GenerateConventionMagicLinkUrl = ReturnType<
  typeof makeGenerateConventionMagicLinkUrl
>;

export const makeGenerateConventionMagicLinkUrl =
  (config: AppConfig, generateJwt: GenerateConventionJwt) =>
  ({
    targetRoute,
    lifetime = "short",
    ...jwtPayload
  }: OmitFromExistingKeys<
    CreateConventionMagicLinkPayloadProperties,
    "durationDays"
  > & {
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

    return `${config.immersionFacileBaseUrl}/${targetRoute}?jwt=${jwt}`;
  };
