import {
  type AgencyId,
  type InclusionConnectedUser,
  type UserWithAdminRights,
  errors,
} from "shared";

export const throwIfNotAdmin = (user: UserWithAdminRights | undefined) => {
  if (!user) throw errors.user.unauthorized();
  if (!user.isBackofficeAdmin) throw errors.user.forbidden({ userId: user.id });
};

export const throwIfNotAgencyAdminOrBackofficeAdmin = (
  agencyId: AgencyId,
  currentUser?: InclusionConnectedUser,
): void => {
  if (!currentUser) throw errors.user.unauthorized();
  if (currentUser.isBackofficeAdmin) return;

  const hasPermission = currentUser.agencyRights.some(
    (agencyRight) =>
      agencyRight.agency.id === agencyId &&
      agencyRight.roles.includes("agency-admin"),
  );

  if (!hasPermission) {
    throw errors.user.forbidden({ userId: currentUser.id });
  }
};
