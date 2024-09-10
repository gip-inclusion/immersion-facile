import { Flavor, InclusionConnectJwt } from "..";
import { ConventionDto } from "../convention/convention.dto";
import {
  AgencyRole,
  InclusionConnectedUser,
  User,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import { EstablishmentRole, Role } from "../role/role.dto";
import { allowedStartInclusionConnectLoginPages } from "../routes/routes";
import { ExcludeFromExisting, ExtractFromExisting } from "../utils";

export type IdToken = Flavor<string, "IdToken">;
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
  idToken: string;
} & Pick<User, "email" | "firstName" | "lastName">;

type InclusionConnectConventionManageAllowedRole =
  | EstablishmentRole
  | ExtractFromExisting<Role, "back-office">
  | ExcludeFromExisting<AgencyRole, "to-review">;

export const getIcUserRoleForAccessingConvention = (
  convention: ConventionDto,
  user: InclusionConnectedUser,
): InclusionConnectConventionManageAllowedRole[] => {
  const roles: InclusionConnectConventionManageAllowedRole[] = [];
  if (user.isBackofficeAdmin) roles.push("back-office");
  if (convention.signatories.establishmentRepresentative.email === user.email)
    roles.push("establishment-representative");
  if (convention.establishmentTutor.email === user.email)
    roles.push("establishment-tutor");
  const agencyRight = user.agencyRights.find(
    (agencyRight) => agencyRight.agency.id === convention.agencyId,
  );

  if (agencyRight && agencyRoleIsNotToReview(agencyRight.roles))
    roles.push(...agencyRight.roles);

  return roles;
};

export const agencyRoleIsNotToReview = (
  agencyRoles: AgencyRole[],
): agencyRoles is ExcludeFromExisting<AgencyRole, "to-review">[] =>
  !agencyRoles.includes("to-review");

export const inclusionConnectTokenExpiredMessage = "Token is expired";
