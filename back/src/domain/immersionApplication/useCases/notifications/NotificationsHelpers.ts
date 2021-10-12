import { ENV } from "../../../../adapters/primary/environmentVariables";
import {
  createMagicLinkPayload,
  Role,
} from "../../../../shared/tokens/MagicLinkPayload";
import { generateJwt } from "../../../auth/jwt";
import { frontRoutes } from "../../../../shared/routes";

export const generateMagicLinkString = (id: string, role: Role) => {
  return ENV.baseURL
    .concat(`/${frontRoutes.immersionApplicationsToValidate}?jwt=`)
    .concat(generateJwt(createMagicLinkPayload(id, role)));
};
