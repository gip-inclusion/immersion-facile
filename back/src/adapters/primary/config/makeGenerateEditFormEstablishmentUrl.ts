import { EstablishmentJwtPayload, frontRoutes } from "shared";
import {
  GenerateEditFormEstablishmentUrl,
  makeGenerateJwtES256,
} from "../../../domain/auth/jwt";
import { AppConfig } from "./appConfig";

export const makeGenerateEditFormEstablishmentUrl =
  (config: AppConfig): GenerateEditFormEstablishmentUrl =>
  (payload: EstablishmentJwtPayload) =>
    `${config.immersionFacileBaseUrl}/${
      frontRoutes.editFormEstablishmentRoute
    }?jwt=${makeGenerateJwtES256<EstablishmentJwtPayload>(
      config.magicLinkJwtPrivateKey,
    )(payload)}`;
