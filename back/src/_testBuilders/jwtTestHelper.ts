import { CreateConventionMagicLinkPayloadProperties } from "shared";

import { GenerateConventionMagicLinkUrl } from "../adapters/primary/config/magicLinkUrl";
import {
  GenerateConventionJwt,
  GenerateEditFormEstablishmentJwt,
} from "../domain/auth/jwt";

export const generateConventionJwtTestFn: GenerateConventionJwt = (payload) => {
  const { applicationId, role, iat } = payload;
  return applicationId + ";" + role + ";" + iat;
};

export const generateEditFormEstablishmentJwtTestFn: GenerateEditFormEstablishmentJwt =
  (payload) => {
    const { siret } = payload;
    return siret + "-in-token";
  };

export const fakeGenerateMagicLinkUrlFn: GenerateConventionMagicLinkUrl = ({
  email,
  id,
  now,
  role,
  targetRoute,
}: CreateConventionMagicLinkPayloadProperties & { targetRoute: string }) =>
  `http://fake-magic-link/${id}/${targetRoute}/${role}/${now.toISOString()}/${email}`;
