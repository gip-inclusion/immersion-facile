import type {
  WithAgencyDashboards,
  WithAgencyRights,
} from "../agency/agency.dto";
import type { IdentityProvider } from "../auth/auth.dto";
import type { ProConnectInfos } from "../auth/proConnect/proConnect.dto";
import type { Email } from "../email/email.dto";
import type {
  WithEstablishmentDashboards,
  WithEstablishmentsData,
} from "../establishment/establishment";
import type { ConnectedUserJwt } from "../tokens/jwt.dto";
import type { Flavor } from "../typeFlavors";
import type { DateTimeIsoString } from "../utils/date";

export type UserId = Flavor<string, "UserId">;

export type WithOptionalUserId = {
  userId?: UserId;
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
export type UserWithNumberOfAgenciesAndEstablishments = User & {
  numberOfAgencies: number;
  numberOfEstablishments: number;
};

export type WithDashboards = {
  dashboards: WithAgencyDashboards & WithEstablishmentDashboards;
};

export type UserWithAgencyRights = User & WithAgencyRights;

export type WithIsBackOfficeAdmin = {
  isBackofficeAdmin?: boolean;
};

export type UserWithRights = UserWithAgencyRights &
  WithEstablishmentsData &
  WithIsBackOfficeAdmin;

export type ConnectedUser = UserWithRights & WithDashboards;

export type ConnectedUserQueryParams = {
  token: ConnectedUserJwt;
  idToken: string;
  provider: IdentityProvider;
} & Pick<User, "email" | "firstName" | "lastName">;
