import { ImmersionApplicationId } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import {
  createMagicLinkPayload,
  Role,
} from "shared/src/tokens/MagicLinkPayload";
import { makeGenerateJwt } from "../../../domain/auth/jwt";
import { AppConfig } from "./appConfig";

export type GenerateVerificationMagicLink = ReturnType<
  typeof createGenerateVerificationMagicLink
>;

export const createGenerateVerificationMagicLink = (config: AppConfig) => {
  const generateJwt = makeGenerateJwt(config.magicLinkJwtPrivateKey);

  return (
    id: ImmersionApplicationId,
    role: Role,
    targetRoute: string,
    email: string,
  ) => {
    const baseUrl = config.immersionFacileBaseUrl;
    const jwt = generateJwt(createMagicLinkPayload(id, role, email));
    return `${baseUrl}/${targetRoute}?jwt=${jwt}`;
  };
};
