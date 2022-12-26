import {
  createConventionMagicLinkPayload,
  CreateConventionMagicLinkPayloadProperties,
} from "shared";
import { makeGenerateJwtES256 } from "../../../domain/auth/jwt";
import { AppConfig } from "./appConfig";

export type GenerateConventionMagicLink = ReturnType<
  typeof createGenerateConventionMagicLink
>;

export const createGenerateConventionMagicLink =
  (config: AppConfig) =>
  ({
    targetRoute,
    ...jwtPayload
  }: CreateConventionMagicLinkPayloadProperties & {
    targetRoute: string;
  }) =>
    `${config.immersionFacileBaseUrl}/${targetRoute}?jwt=${makeGenerateJwtES256(
      config.magicLinkJwtPrivateKey,
    )(createConventionMagicLinkPayload(jwtPayload))}`;
