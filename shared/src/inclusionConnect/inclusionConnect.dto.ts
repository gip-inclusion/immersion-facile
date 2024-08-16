import { Flavor, InclusionConnectJwt } from "..";
import { ConventionDto } from "../convention/convention.dto";
import {
  AgencyRole,
  InclusionConnectedUser,
  User,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { SignatoryRole } from "../role/role.dto";
import { allowedStartInclusionConnectLoginPages } from "../routes/routes";
import { ExcludeFromExisting, ExtractFromExisting } from "../utils";

export type IdentityProvider = "inclusionConnect" | "proConnect";
export type OAuthState = Flavor<string, "OAuthState">;
export type OAuthCode = Flavor<string, "OAuthCode">;
export type AuthenticateWithOAuthCodeParams = WithSourcePage & {
  state: OAuthState;
  code: OAuthCode;
};

export type AllowedStartInclusionConnectLoginSourcesKind =
  (typeof allowedStartInclusionConnectLoginPages)[number];

export type WithSourcePage = {
  page: AllowedStartInclusionConnectLoginSourcesKind;
};

export type AuthenticatedUserQueryParams = {
  token: InclusionConnectJwt;
} & Pick<User, "email" | "firstName" | "lastName">;

type InclusionConnectConventionManageAllowedRole =
  | ExcludeFromExisting<AgencyRole, "toReview">
  | ExtractFromExisting<SignatoryRole, "establishment-representative">
  | "backOffice";

export const getIcUserRoleForAccessingConvention = (
  convention: ConventionDto,
  user: InclusionConnectedUser,
): InclusionConnectConventionManageAllowedRole[] => {
  const roles: InclusionConnectConventionManageAllowedRole[] = [];
  if (user.isBackofficeAdmin) roles.push("backOffice");
  if (convention.signatories.establishmentRepresentative.email === user.email)
    roles.push("establishment-representative");
  const agencyRight = user.agencyRights.find(
    (agencyRight) => agencyRight.agency.id === convention.agencyId,
  );

  if (agencyRight && agencyRoleIsNotToReview(agencyRight.roles))
    roles.push(...agencyRight.roles);

  return roles;
};

export const agencyRoleIsNotToReview = (
  agencyRoles: AgencyRole[],
): agencyRoles is ExcludeFromExisting<AgencyRole, "toReview">[] =>
  !agencyRoles.includes("toReview");

export const inclusionConnectTokenExpiredMessage = "Token is expired";
