import {
  ActiveOrRejectedStatus,
  AgencyId,
  WithAgencyId,
} from "../agency/agency.dto";
import { ConventionId } from "../convention/convention.dto";
import { Email } from "../email/email.dto";
import {
  AgencyRole,
  UserId,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { SiretDto } from "../siret/siret";
import { OmitFromExistingKeys } from "../utils";

export type RemoveAgencyUserParams = {
  agencyId: AgencyId;
  userId: UserId;
};

export type UserParamsForAgency = {
  agencyId: AgencyId;
  roles: AgencyRole[];
  userId: UserId;
  isNotifiedByEmail: boolean;
  email: Email;
};

export type RejectIcUserRoleForAgencyParams = OmitFromExistingKeys<
  UserParamsForAgency,
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

export type GetUsersFilters = {
  emailContains: string;
};
