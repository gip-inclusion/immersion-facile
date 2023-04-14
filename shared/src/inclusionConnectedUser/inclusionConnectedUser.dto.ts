import { AgencyDto } from "../agency/agency.dto";
import { Flavor } from "../typeFlavors";

export type AgencyRole = (typeof allAgencyRoles)[number];
export const allAgencyRoles = [
  "counsellor",
  "validator",
  "agencyOwner",
  "toReview",
] as const;

export type AgencyRight = {
  agency: AgencyDto;
  role: AgencyRole;
};

export type AuthenticatedUserId = Flavor<string, "AuthenticatedUserId">;

export type AuthenticatedUser = {
  id: AuthenticatedUserId;
  email: string;
  firstName: string;
  lastName: string;
};

export type InclusionConnectedUser = AuthenticatedUser & {
  agencyRights: AgencyRight[];
};
