import { ConventionId } from "../convention/convention.dto";
import { UserId } from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { Role } from "../role/role.dto";
import { SiretDto } from "../siret/siret";
import { ValueOf } from "../utils";

export type CommonJwtPayload = {
  iat?: number; // number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  exp?: number; // number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  version: number;
};

export type StandardJwtPayload<R extends Role> = {
  sub: string;
  role: R;
};

export type BackOfficeDomainPayload = StandardJwtPayload<"backOffice">;
export type BackOfficeJwtPayload = CommonJwtPayload & BackOfficeDomainPayload;

export type ConventionDomainPayload = {
  applicationId: ConventionId;
  role: Role;
  emailHash: string; //< md5 of email
  sub?: string;
};
export type ConventionJwtPayload = CommonJwtPayload & ConventionDomainPayload;

export type InclusionConnectDomainJwtPayload = { userId: UserId };
export type InclusionConnectJwtPayload = CommonJwtPayload &
  InclusionConnectDomainJwtPayload;

export type ConventionRelatedJwtPayload =
  | BackOfficeDomainPayload
  | ConventionDomainPayload
  | InclusionConnectDomainJwtPayload;

export type EstablishmentDomainPayload = {
  siret: SiretDto;
};
export type EstablishmentJwtPayload = CommonJwtPayload &
  EstablishmentDomainPayload;

export type CreateConventionMagicLinkPayloadProperties = {
  id: ConventionId;
  role: Role;
  email: string;
  now: Date;
  durationDays?: number;
  iat?: number;
  exp?: number;
  version?: number;
  sub?: string;
};

export type JwtPayloads = {
  convention?: ConventionJwtPayload;
  establishment?: EstablishmentJwtPayload;
  inclusion?: InclusionConnectJwtPayload;
  backOffice?: BackOfficeJwtPayload;
};
export type PayloadKey = keyof JwtPayloads;
export type PayloadOption = ValueOf<Required<JwtPayloads>>;

export const isEstablishmentJwtPayload = (
  payload: any,
): payload is EstablishmentJwtPayload => {
  return "siret" in payload;
};

export const isBackOfficeJwtPayload = (
  payload: any,
): payload is BackOfficeJwtPayload => {
  return payload.role === "backOffice";
};

export const isInclusionConnectJwtPayload = (
  payload: any,
): payload is InclusionConnectJwtPayload => {
  return "userId" in payload;
};
