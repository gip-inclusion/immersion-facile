import { ConventionId, createConventionMagicLinkPayload, Role } from "shared";
import { makeGenerateJwtES256 } from "../../../domain/auth/jwt";
import { AppConfig } from "./appConfig";

export type GenerateConventionMagicLink = ReturnType<
  typeof createGenerateConventionMagicLink
>;

export const createGenerateConventionMagicLink = (config: AppConfig) => {
  const generateJwt = makeGenerateJwtES256(config.magicLinkJwtPrivateKey);

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
