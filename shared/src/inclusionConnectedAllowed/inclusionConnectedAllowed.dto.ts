import { AbsoluteUrl } from "../AbsoluteUrl";
import { AgencyDto, AgencyId } from "../agency/agency.dto";
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

type WithAgencyRights = {
  agencyRights: AgencyRight[];
};

type WithDashboardUrl = {
  dashboardUrl?: AbsoluteUrl;
};

export type InclusionConnectedUser = AuthenticatedUser &
  WithAgencyRights &
  WithDashboardUrl;

export type WithAgencyIds = {
  agencies: AgencyId[];
};
