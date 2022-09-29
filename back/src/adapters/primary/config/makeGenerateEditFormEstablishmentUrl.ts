import { EstablishmentJwtPayload, frontRoutes } from "shared";
import {
  GenerateEditFormEstablishmentUrl,
  makeGenerateJwtES256,
} from "../../../domain/auth/jwt";
import { AppConfig } from "./appConfig";

export const makeGenerateEditFormEstablishmentUrl = (
  config: AppConfig,
): GenerateEditFormEstablishmentUrl => {
  const generateJwt = makeGenerateJwtES256<EstablishmentJwtPayload>(
    config.magicLinkJwtPrivateKey,
  );
  return (payload: EstablishmentJwtPayload) => {
    const editJwt = generateJwt(payload);
    return `${config.immersionFacileBaseUrl}/${frontRoutes.editFormEstablishmentRoute}?jwt=${editJwt}`;
  };
};
