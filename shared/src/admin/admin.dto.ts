import type {
  ActiveOrRejectedStatus,
  AgencyId,
  WithAgencyId,
} from "../agency/agency.dto";
import type { ConventionId } from "../convention/convention.dto";
import type { Email } from "../email/email.dto";
import type { AgencyRole } from "../role/role.dto";
import type { SiretDto } from "../siret/siret";
import type { UserId } from "../user/user.dto";

export type WithAgencyIdAndUserId = {
  agencyId: AgencyId;
  userId: UserId;
};

export type UserParamsForAgency = WithAgencyIdAndUserId & {
  roles: AgencyRole[];
  isNotifiedByEmail: boolean;
  email: Email;
};

export type RejectConnectedUserRoleForAgencyParams = WithAgencyIdAndUserId & {
  justification: string;
};

export type WithAgencyRole = {
  agencyRole: AgencyRole;
};

export type WithUserFilters = WithAgencyId | WithAgencyRole;
export const isWithAgencyRole = (
  filter: WithUserFilters,
): filter is WithAgencyRole => "agencyRole" in filter;

export const isWithAgencyId = (
  filter: WithUserFilters,
): filter is WithAgencyId => "agencyId" in filter;

export type ManageConventionAdminForm = {
  conventionId: ConventionId;
};

export type ManageEstablishmentAdminForm = {
  siret: SiretDto;
};

export type UpdateAgencyStatusParams = {
  id: AgencyId;
} & UpdateAgencyStatusParamsWithoutId;

export type UpdateAgencyStatusParamsWithoutId =
  | {
      status: Extract<ActiveOrRejectedStatus, "active">;
    }
  | {
      status: Extract<ActiveOrRejectedStatus, "rejected">;
      statusJustification: string;
    };

export type GetUsersFilters = {
  emailContains: string;
};
