import { AbsoluteUrl } from "../AbsoluteUrl";
import { AgencyDto, AgencyId } from "../agency/agency.dto";
import { Email } from "../email/email.dto";
import { WithSourcePage } from "../inclusionConnect/inclusionConnect.dto";
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
  email: Email;
  firstName: string;
  lastName: string;
};

type WithAgencyRights = {
  agencyRights: AgencyRight[];
};

export type WithDashboardUrls = {
  agencyDashboardUrl?: AbsoluteUrl;
  erroredConventionsDashboardUrl?: AbsoluteUrl;
  establishmentRepresentativeDashboardUrl?: AbsoluteUrl;
};

export type InclusionConnectedUser = AuthenticatedUser &
  WithAgencyRights &
  WithDashboardUrls;

export type WithAgencyIds = {
  agencies: AgencyId[];
};

export type GetInclusionConnectLogoutUrlQueryParams = WithSourcePage;
