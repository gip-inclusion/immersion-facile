import {
  CreateConventionMagicLinkPayloadProperties,
  filterNotUndefined,
} from "shared";
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
  exp,
  durationDays,
  iat,
  version,
  role,
  targetRoute,
}: CreateConventionMagicLinkPayloadProperties & { targetRoute: string }) => {
  const fakeJwt = [
    id,
    role,
    now.toISOString(),
    email,
    exp,
    durationDays,
    iat,
    version,
  ]
    .filter(filterNotUndefined)
    .join("/");
  return `http://fake-magic-link/${targetRoute}/${fakeJwt}`;
};
