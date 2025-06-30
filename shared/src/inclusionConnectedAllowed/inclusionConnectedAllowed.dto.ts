import type { AbsoluteUrl } from "../AbsoluteUrl";
import type {
  AgencyDtoForAgencyUsersAndAdmins,
  AgencyId,
} from "../agency/agency.dto";
import type { DiscussionId } from "../discussion/discussion.dto";
import type { Email } from "../email/email.dto";
import type { WithRedirectUri } from "../inclusionConnect/inclusionConnect.dto";
import type { EstablishmentRole } from "../role/role.dto";
import type { SiretDto } from "../siret/siret";
import type { Flavor } from "../typeFlavors";
import type { DateTimeIsoString } from "../utils/date";

export type AgencyRole = (typeof allAgencyRoles)[number];
export const allAgencyRoles = [
  "counsellor",
  "validator",
  "agency-admin",
  "to-review",
  "agency-viewer",
] as const;

export type AgencyRight = {
  agency: AgencyDtoForAgencyUsersAndAdmins;
  roles: AgencyRole[];
  isNotifiedByEmail: boolean;
};

export type UserId = Flavor<string, "UserId">;
export type ExternalId = Flavor<string, "ExternalId">;

export type ProConnectInfos = {
  externalId: ExternalId;
  siret: SiretDto;
};

export type User = {
  id: UserId;
  email: Email;
  firstName: string;
  lastName: string;
  createdAt: DateTimeIsoString;
  proConnect: ProConnectInfos | null;
};

export type UserWithAdminRights = User & WithIsBackOfficeAdmin;

export type UserInList = User & {
  numberOfAgencies: number;
};

type WithAgencyRights = {
  agencyRights: AgencyRight[];
};

export type EstablishmentAdminPrivateData = {
  firstName: string;
  lastName: string;
  email: Email;
};

export type WithEstablishmentData = {
  siret: SiretDto;
  businessName: string;
  role: EstablishmentRole;
  admins: EstablishmentAdminPrivateData[];
};

export type WithEstablishments = {
  establishments?: WithEstablishmentData[];
};

export type WithDiscussionId = {
  discussionId: DiscussionId;
};

export type EstablishmentDashboards = {
  conventions?: AbsoluteUrl;
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

export type WithIsBackOfficeAdmin = {
  isBackofficeAdmin?: boolean;
};

export type UserWithRights = UserWithAgencyRights &
  WithEstablishments &
  WithIsBackOfficeAdmin;

export type InclusionConnectedUser = UserWithRights & WithDashboards;

export type WithOptionalUserId = {
  userId?: UserId;
};

export type WithAgencyIds = {
  agencies: AgencyId[];
};

export type GetInclusionConnectLogoutUrlQueryParams = WithRedirectUri;
