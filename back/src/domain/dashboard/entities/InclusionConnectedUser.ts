import { AgencyDto } from "shared";
import { AuthenticatedUser } from "shared";

export type InclusionConnectedUser = AuthenticatedUser & {
  agencies: AgencyDto[];
};
