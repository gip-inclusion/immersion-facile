import { ConventionId } from "shared/src/convention/convention.dto";
import {
  createConventionMagicLinkPayload,
  Role,
} from "shared/src/tokens/MagicLinkPayload";
import { makeGenerateJwt } from "../../../domain/auth/jwt";
import { AppConfig } from "./appConfig";

export type GenerateConventionMagicLink = ReturnType<
  typeof createGenerateConventionMagicLink
>;

export const createGenerateConventionMagicLink = (config: AppConfig) => {
  const generateJwt = makeGenerateJwt(config.magicLinkJwtPrivateKey);

  return ({
    id,
    role,
    targetRoute,
    email,
  }: {
    id: ConventionId;
    role: Role;
    targetRoute: string;
    email: string;
  }) => {
    const baseUrl = config.immersionFacileBaseUrl;
    const jwt = generateJwt(createConventionMagicLinkPayload(id, role, email));
    return `${baseUrl}/${targetRoute}?jwt=${jwt}`;
  };
};
