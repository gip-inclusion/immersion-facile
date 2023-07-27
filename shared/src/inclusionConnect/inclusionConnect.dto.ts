import { ConventionReadDto } from "../convention/convention.dto";
import {
  AgencyRole,
  AuthenticatedUser,
  InclusionConnectedUser,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { ExcludeFromExisting } from "../utils";

export type AuthenticateWithInclusionCodeConnectParams = {
  code: string;
  state: string;
};

export type AuthenticatedUserQueryParams = { token: string } & Pick<
  AuthenticatedUser,
  "email" | "firstName" | "lastName"
>;

export const getUserRoleForAccessingConvention = (
  convention: ConventionReadDto,
  user: InclusionConnectedUser,
): ExcludeFromExisting<AgencyRole, "toReview"> | null => {
  const agencyRight = user.agencyRights.find(
    (agencyRight) => agencyRight.agency.id === convention.agencyId,
  );
  if (!agencyRight) return null;
  if (agencyRight.role === "toReview") return null;
  return agencyRight.role;
};
