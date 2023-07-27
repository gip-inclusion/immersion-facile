import { ConventionId } from "../convention/convention.dto";
import { AuthenticatedUserId } from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { Role } from "../role/role.dto";
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

type BackOfficeDomainPayload = StandardJwtPayload<"backOffice">;
type ConventionDomainPayload = {
  applicationId: ConventionId;
  role: Role;
  emailHash: string; //< md5 of email
  sub?: string;
};
type EstablishmentDomainPayload = {
  siret: string;
};

export type ConventionRelatedJwtPayload =
  | BackOfficeJwtPayload
  | ConventionJwtPayload
  | InclusionConnectDomainJwtPayload;

export type InclusionConnectDomainJwtPayload = { userId: AuthenticatedUserId };

export type BackOfficeJwtPayload = CommonJwtPayload & BackOfficeDomainPayload;
export type ConventionJwtPayload = CommonJwtPayload & ConventionDomainPayload;
export type EstablishmentJwtPayload = CommonJwtPayload &
  EstablishmentDomainPayload;
export type InclusionConnectJwtPayload = CommonJwtPayload &
  InclusionConnectDomainJwtPayload;

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
