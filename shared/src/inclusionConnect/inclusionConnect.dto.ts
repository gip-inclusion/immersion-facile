import type { ConnectedUserJwt, Flavor, UserWithRights } from "..";
import type { ConventionDto } from "../convention/convention.dto";
import type {
  AgencyRole,
  User,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import type { ConventionEstablishmentRole, Role } from "../role/role.dto";
import type { allowedStartOAuthLoginPages } from "../routes/routes";
import type { ExcludeFromExisting, ExtractFromExisting } from "../utils";

export type IdToken = Flavor<string, "IdToken">;
export type IdentityProvider = "proConnect";
export type OAuthState = Flavor<string, "OAuthState">;
export type OAuthCode = Flavor<string, "OAuthCode">;
export type AuthenticateWithOAuthCodeParams = WithSourcePage & {
  state: OAuthState;
  code: OAuthCode;
};

export type AllowedStartInclusionConnectLoginSourcesKind =
  (typeof allowedStartOAuthLoginPages)[number];

export type WithSourcePage = {
  page: AllowedStartInclusionConnectLoginSourcesKind;
};

export type AuthenticatedUserQueryParams = {
  token: ConnectedUserJwt;
  idToken: string;
  siret?: string; // remove optional when inclusion connect is removed
} & Pick<User, "email" | "firstName" | "lastName">;

type InclusionConnectConventionManageAllowedRole =
  | ConventionEstablishmentRole
  | ExtractFromExisting<Role, "back-office">
  | ExcludeFromExisting<AgencyRole, "to-review">;

export const getIcUserRoleForAccessingConvention = (
  convention: ConventionDto,
  user: UserWithRights,
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
