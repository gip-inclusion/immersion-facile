import {
  type AbsoluteUrl,
  type CreateConventionMagicLinkPayloadProperties,
  type EstablishmentJwtPayload,
  type OmitFromExistingKeys,
  createConventionMagicLinkPayload,
  frontRoutes,
} from "shared";
import type {
  GenerateConventionJwt,
  GenerateEditFormEstablishmentJwt,
} from "../../domains/core/jwt";
import type { AppConfig } from "./appConfig";

export const makeGenerateEditFormEstablishmentUrl =
  (
    config: AppConfig,
    generateEditEstablishmentJwt: GenerateEditFormEstablishmentJwt,
  ): GenerateEditFormEstablishmentJwt =>
  (payload: EstablishmentJwtPayload): AbsoluteUrl => {
    const jwt = generateEditEstablishmentJwt(payload);
    return `${config.immersionFacileBaseUrl}/${frontRoutes.editFormEstablishmentRoute}?jwt=${jwt}`;
  };

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
