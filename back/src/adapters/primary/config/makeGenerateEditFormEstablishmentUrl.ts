import {
  GenerateEditFormEstablishmentUrl,
  makeGenerateJwt,
} from "../../../domain/auth/jwt";
import { AppConfig } from "./appConfig";
import { EstablishmentJwtPayload } from "shared/src/tokens/MagicLinkPayload";
import { frontRoutes } from "shared/src/routes";

export const makeGenerateEditFormEstablishmentUrl = (
  config: AppConfig,
): GenerateEditFormEstablishmentUrl => {
  const generateJwt = makeGenerateJwt<EstablishmentJwtPayload>(
    config.magicLinkJwtPrivateKey,
  );
  return (payload: EstablishmentJwtPayload) => {
    const editJwt = generateJwt(payload);
    return `${config.immersionFacileBaseUrl}/${frontRoutes.editFormEstablishmentRoute}?jwt=${editJwt}`;
  };
};
