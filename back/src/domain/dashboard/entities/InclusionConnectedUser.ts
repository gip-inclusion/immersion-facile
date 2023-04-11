import { AgencyDto } from "shared";
import { AuthenticatedUser } from "shared";

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

export type InclusionConnectedUser = AuthenticatedUser & {
  agencyRights: AgencyRight[];
};
