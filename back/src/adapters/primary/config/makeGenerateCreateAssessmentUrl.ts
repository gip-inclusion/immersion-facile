import {
  GenerateCreateImmersionAssessmentUrl,
  makeGenerateJwt,
} from "../../../domain/auth/jwt";
import { AppConfig } from "./appConfig";
import { ConventionJwtPayload } from "shared/src/tokens/MagicLinkPayload";
import { frontRoutes } from "shared/src/routes";

export const makeGenerateCreateAssessmentUrl = (
  config: AppConfig,
): GenerateCreateImmersionAssessmentUrl => {
  const generateJwt = makeGenerateJwt<ConventionJwtPayload>(
    config.magicLinkJwtPrivateKey,
  );
  return (payload: ConventionJwtPayload) => {
    const editJwt = generateJwt(payload);
    return `${config.immersionFacileBaseUrl}/${frontRoutes.immersionAssessment}?jwt=${editJwt}`;
  };
};
