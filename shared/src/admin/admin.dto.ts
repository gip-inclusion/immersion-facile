import { ActiveOrRejectedStatus, AgencyId } from "../agency/agency.dto";
import { ConventionId } from "../convention/convention.dto";
import {
  AgencyRole,
  UserId,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { SiretDto } from "../siret/siret";
import { OmitFromExistingKeys } from "../utils";

export type UserAndPassword = {
  user: string;
  password: string;
};

export type IcUserRoleForAgencyParams = {
  agencyId: AgencyId;
  role: AgencyRole;
  userId: UserId;
};

export type RejectIcUserRoleForAgencyParams = OmitFromExistingKeys<
  IcUserRoleForAgencyParams,
  "role"
> & {
  justification: string;
};

export type WithAgencyRole = {
  agencyRole: AgencyRole;
};

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
