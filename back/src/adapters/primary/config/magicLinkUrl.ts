import {
  AbsoluteUrl,
  createConventionMagicLinkPayload,
  CreateConventionMagicLinkPayloadProperties,
  EstablishmentJwtPayload,
  frontRoutes,
} from "shared";

import {
  GenerateConventionJwt,
  GenerateEditFormEstablishmentJwt,
} from "../../../domain/auth/jwt";

import { AppConfig } from "./appConfig";

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
    ...jwtPayload
  }: CreateConventionMagicLinkPayloadProperties & {
    targetRoute: string;
  }): AbsoluteUrl => {
    const jwt = generateJwt(createConventionMagicLinkPayload(jwtPayload));
    return `${config.immersionFacileBaseUrl}/${targetRoute}?jwt=${jwt}`;
  };
