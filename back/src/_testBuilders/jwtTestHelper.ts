import {
  BackOfficeJwtPayload,
  CreateConventionMagicLinkPayloadProperties,
  filterNotFalsy,
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

type GenerateMagicLinkUrlParams = { targetRoute: string } & (
  | CreateConventionMagicLinkPayloadProperties
  | BackOfficeJwtPayload
);

export const fakeGenerateMagicLinkUrlFn: GenerateConventionMagicLinkUrl = (
  params: GenerateMagicLinkUrlParams,
) => {
  if (params.role === "backOffice") {
    const { exp, iat, version, role, targetRoute, sub } = params;
    const fakeJwt = [exp, iat, version, role, sub]
      .filter(filterNotFalsy)
      .join("/");
    return `http://fake-magic-link/${targetRoute}/${fakeJwt}`;
  }

  const { email, id, now, exp, durationDays, iat, version, role, targetRoute } =
    params;

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
    .filter(filterNotFalsy)
    .join("/");
  return `http://fake-magic-link/${targetRoute}/${fakeJwt}`;
};
