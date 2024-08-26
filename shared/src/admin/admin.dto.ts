import {
  ActiveOrRejectedStatus,
  AgencyId,
  WithAgencyId,
} from "../agency/agency.dto";
import { ConventionId } from "../convention/convention.dto";
import {
  AgencyRole,
  UserId,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { SiretDto } from "../siret/siret";
import { OmitFromExistingKeys } from "../utils";

export type UserUpdateParamsForAgency = {
  agencyId: AgencyId;
  roles: AgencyRole[];
  userId: UserId;
  isNotifiedByEmail: boolean;
  email: string | null;
};

export type RejectIcUserRoleForAgencyParams = OmitFromExistingKeys<
  UserUpdateParamsForAgency,
  "roles" | "isNotifiedByEmail" | "email"
> & {
  justification: string;
};

export type WithAgencyRole = {
  agencyRole: AgencyRole;
};

export type WithUserFilters = WithAgencyId | WithAgencyRole;

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
      rejectionJustification: string;
    };
