import { AbsoluteUrl } from "../AbsoluteUrl";
import { AgencyDto, AgencyId } from "../agency/agency.dto";
import { DiscussionId } from "../discussion/discussion.dto";
import { Email } from "../email/email.dto";
import { WithSourcePage } from "../inclusionConnect/inclusionConnect.dto";
import { EstablishmentRole } from "../role/role.dto";
import { SiretDto } from "../siret/siret";
import { Flavor } from "../typeFlavors";
import { DateTimeIsoString } from "../utils/date";

export type AgencyRole = (typeof allAgencyRoles)[number];
export const allAgencyRoles = [
  "counsellor",
  "validator",
  "agency-admin",
  "to-review",
  "agency-viewer",
] as const;

export type AgencyRight = {
  agency: AgencyDto;
  roles: AgencyRole[];
  isNotifiedByEmail: boolean;
};

export type UserId = Flavor<string, "UserId">;
export type ExternalId = Flavor<string, "ExternalId">;

export type User = {
  id: UserId;
  email: Email;
  firstName: string;
  lastName: string;
  externalId: ExternalId | null;
  createdAt: DateTimeIsoString;
};

export type UserInList = User & {
  numberOfAgencies: number;
};

type WithAgencyRights = {
  agencyRights: AgencyRight[];
};

export type WithEstablismentsSiretAndName = {
  siret: SiretDto;
  businessName: string;
};

type WithEstablishments = {
  establishments?: WithEstablismentsSiretAndName[];
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
  establishments: EstablishmentDashboards;
};

export type AgencyDashboards = {
  agencyDashboardUrl?: AbsoluteUrl;
  erroredConventionsDashboardUrl?: AbsoluteUrl;
};

export type WithAgencyDashboards = {
  agencies: AgencyDashboards;
};

export type WithDashboards = {
  dashboards: WithAgencyDashboards & WithEstablishmentDashboards;
};

export type UserWithAgencyRights = User & WithAgencyRights;

export type InclusionConnectedUser = UserWithAgencyRights &
  WithEstablishments &
  WithDashboards & { isBackofficeAdmin?: boolean };

export type WithOptionalUserId = {
  userId?: UserId;
};

export type WithAgencyIds = {
  agencies: AgencyId[];
};

export type GetInclusionConnectLogoutUrlQueryParams = WithSourcePage;
