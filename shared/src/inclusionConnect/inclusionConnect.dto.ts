import type { ConventionDto } from "../convention/convention.dto";
import type { Email } from "../email/email.dto";
import type {
  AgencyRole,
  User,
  UserWithRights,
} from "../inclusionConnectedAllowed/inclusionConnectedAllowed.dto";
import type {
  ConventionEstablishmentRole,
  EstablishmentRole,
  Role,
} from "../role/role.dto";
import type { allowedStartOAuthLoginPages } from "../routes/routes";
import type { ConnectedUserJwt, EmailAuthCodeJwt } from "../tokens/jwt.dto";
import type { Flavor } from "../typeFlavors";
import type { ExcludeFromExisting, ExtractFromExisting } from "../utils";

export type IdToken = Flavor<string, "IdToken">;
export type IdentityProvider = "proConnect" | "email";
export type OAuthState = Flavor<string, "OAuthState">;
export type OAuthCode = Flavor<string, "OAuthCode">;

export type AuthenticateWithOAuthCodeParams = WithSourcePage & {
  state: OAuthState;
  code: OAuthCode | EmailAuthCodeJwt;
};

export type AllowedStartInclusionConnectLoginSourcesKind =
  (typeof allowedStartOAuthLoginPages)[number];

export type WithSourcePage = {
  page: AllowedStartInclusionConnectLoginSourcesKind;
};

export type AuthenticatedUserQueryParams = {
  token: ConnectedUserJwt;
  idToken: string;
  provider: IdentityProvider;
} & Pick<User, "email" | "firstName" | "lastName">;

type InclusionConnectConventionManageAllowedRole =
  | EstablishmentRole
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

  const establishmentRights = user.establishments?.find(
    (establishment) => establishment.siret === convention.siret,
  );
  if (establishmentRights) roles.push(establishmentRights.role);
  return roles;
};

export const agencyRoleIsNotToReview = (
  agencyRoles: AgencyRole[],
): agencyRoles is ExcludeFromExisting<AgencyRole, "to-review">[] =>
  !agencyRoles.includes("to-review");

export const inclusionConnectTokenExpiredMessage = "Token is expired";

export type InitiateLoginByEmailParams = {
  page: AllowedStartInclusionConnectLoginSourcesKind;
  email: Email;
};
