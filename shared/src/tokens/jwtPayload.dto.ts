import type { ConventionId } from "../convention/convention.dto";
import type {
  InclusionConnectedUser,
  UserId,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import type { Role } from "../role/role.dto";
import type { SiretDto } from "../siret/siret";
import type { Flavor } from "../typeFlavors";
import type { ValueOf } from "../utils";

export type CommonJwtPayload = {
  iat?: number; // number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  exp?: number; // number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  version: number;
};

export type StandardJwtPayload<R extends Role> = {
  sub: string;
  role: R;
};

export type EmailHash = Flavor<string, "EmailHash">;

export type ConventionDomainPayload = {
  applicationId: ConventionId;
  role: Role;
  emailHash: EmailHash; //< md5 of email
  sub?: string;
};
export type ConventionJwtPayload = CommonJwtPayload & ConventionDomainPayload;

export type InclusionConnectDomainJwtPayload = { userId: UserId };
export type InclusionConnectJwtPayload = CommonJwtPayload &
  InclusionConnectDomainJwtPayload;

export type ConventionRelatedJwtPayload =
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
  currentUser?: InclusionConnectedUser;
};
export type PayloadKey = keyof JwtPayloads;
export type PayloadOption = ValueOf<Required<JwtPayloads>>;
