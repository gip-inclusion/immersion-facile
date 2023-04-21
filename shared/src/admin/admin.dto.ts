import { AgencyId } from "../agency/agency.dto";
import {
  AgencyRole,
  AuthenticatedUserId,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";

export type UserAndPassword = {
  user: string;
  password: string;
};

export type IcUserRoleForAgencyParams = {
  agencyId: AgencyId;
  role: AgencyRole;
  userId: AuthenticatedUserId;
};

export type WithAgencyRole = {
  agencyRole: AgencyRole;
};
