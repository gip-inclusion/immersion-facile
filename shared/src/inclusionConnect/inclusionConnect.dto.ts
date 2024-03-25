import { ConventionDto } from "../convention/convention.dto";
import {
  AgencyRole,
  InclusionConnectedUser,
  User,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { SignatoryRole } from "../role/role.dto";
import { allowedStartInclusionConnectLoginPages } from "../routes/routes";
import { ExcludeFromExisting, ExtractFromExisting } from "../utils";

export type AuthenticateWithInclusionCodeConnectParams = WithSourcePage & {
  code: string;
  state: string;
};

export type AllowedStartInclusionConnectLoginSourcesKind =
  (typeof allowedStartInclusionConnectLoginPages)[number];

export type WithSourcePage = {
  page: AllowedStartInclusionConnectLoginSourcesKind;
};

export type AuthenticatedUserQueryParams = {
  token: string;
} & Pick<User, "email" | "firstName" | "lastName">;

export type InclusionConnectConventionManageAllowedRoles =
  | ExcludeFromExisting<AgencyRole, "toReview">
  | ExtractFromExisting<SignatoryRole, "establishment-representative">;

export const getIcUserRoleForAccessingConvention = (
  convention: ConventionDto,
  user: InclusionConnectedUser,
): InclusionConnectConventionManageAllowedRoles | null => {
  if (convention.signatories.establishmentRepresentative.email === user.email)
    return "establishment-representative";
  const agencyRight = user.agencyRights.find(
    (agencyRight) => agencyRight.agency.id === convention.agencyId,
  );
  if (!agencyRight) return null;
  if (agencyRight.role === "toReview") return null;
  return agencyRight.role;
};
