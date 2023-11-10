import { ConventionReadDto } from "../convention/convention.dto";
import {
  AgencyRole,
  AuthenticatedUser,
  InclusionConnectedUser,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { allowedStartInclusionConnectLoginPages } from "../routes/routes";
import { ExcludeFromExisting } from "../utils";

export type AuthenticateWithInclusionCodeConnectParams = WithSourcePage & {
  code: string;
  state: string;
};

export type AllowedStartInclusionConnectLoginSourcesKind =
  (typeof allowedStartInclusionConnectLoginPages)[number];

export type WithSourcePage = {
  page: AllowedStartInclusionConnectLoginSourcesKind;
};

export type StartInclusionConnectLoginQueryParams = WithSourcePage;

export type AuthenticatedUserQueryParams = {
  token: string;
} & Pick<AuthenticatedUser, "email" | "firstName" | "lastName">;

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
