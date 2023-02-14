import { AgencyDto } from "shared";
import { AuthenticatedUser } from "../../generic/OAuth/entities/AuthenticatedUser";

export type InclusionConnectedUser = AuthenticatedUser & {
  agencies: AgencyDto[];
};
