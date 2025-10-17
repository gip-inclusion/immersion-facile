import type { ConventionId } from "../convention/convention.dto";
import type { ConventionRole } from "../role/role.dto";
import type { Flavor } from "../typeFlavors";
import type { ConnectedUser, UserId } from "../user/user.dto";

export type CommonJwtPayload = {
  iat?: number; // number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  exp?: number; // number of seconds from 1970-01-01T00:00:00Z UTC until the specified UTC date/time, ignoring leap seconds
  version: number;
};

export type PayloadKind = "convention" | "connectedUser" | "currentUser";
export type JwtPayloads = {
  convention?: ConventionJwtPayload;
  connectedUser?: ConnectedUserJwtPayload;
  currentUser?: ConnectedUser;
};

export type ConnectedUserDomainJwtPayload = { userId: UserId };
export type ConnectedUserJwtPayload = CommonJwtPayload &
  ConnectedUserDomainJwtPayload;

export type EmailHash = Flavor<string, "EmailHash">;

export type ConventionDomainPayload = {
  applicationId: ConventionId;
  role: ConventionRole;
  emailHash: EmailHash; //< md5 of email
  sub?: string;
};
export type ConventionJwtPayload = CommonJwtPayload & ConventionDomainPayload;

export type ConventionRelatedJwtPayload =
  | ConventionDomainPayload
  | ConnectedUserDomainJwtPayload;

export type CreateConventionMagicLinkPayloadProperties = {
  id: ConventionId;
  role: ConventionRole;
  email: string;
  now: Date;
  durationDays?: number;
  iat?: number;
  exp?: number;
  version?: number;
  sub?: string;
};
