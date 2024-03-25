import { AbsoluteUrl } from "../AbsoluteUrl";
import { AgencyDto, AgencyId } from "../agency/agency.dto";
import { DiscussionId } from "../discussion/discussion.dto";
import { Email } from "../email/email.dto";
import { WithSourcePage } from "../inclusionConnect/inclusionConnect.dto";
import { EstablishmentRole } from "../role/role.dto";
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

export type UserId = Flavor<string, "UserId">;

export type User = {
  id: UserId;
  email: Email;
  firstName: string;
  lastName: string;
  externalId: string;
};

type WithAgencyRights = {
  agencyRights: AgencyRight[];
};

export type ConventionsEstablishmentDashboard = {
  url: AbsoluteUrl;
  role: EstablishmentRole;
};
export type WithDiscussionId = {
  discussionId: DiscussionId;
};

export type EstablishmentDashboards = {
  conventions?: ConventionsEstablishmentDashboard;
  discussions?: AbsoluteUrl;
};

export type WithEstablishmentDashboards = {
  establishmentDashboards: EstablishmentDashboards;
};

export type WithDashboardUrls = {
  agencyDashboardUrl?: AbsoluteUrl;
  erroredConventionsDashboardUrl?: AbsoluteUrl;
} & WithEstablishmentDashboards;

export type InclusionConnectedUser = User &
  WithAgencyRights &
  WithDashboardUrls;

export type WithAgencyIds = {
  agencies: AgencyId[];
};

export type GetInclusionConnectLogoutUrlQueryParams = WithSourcePage;
