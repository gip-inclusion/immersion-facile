import {
  type AgencyId,
  type AgencyRole,
  type AgencyUserForListing,
  type ConnectedUser,
  errors,
  hasAllowedRole,
  toAgencyRightsByAgencyId,
  type UserParamsForAgency,
} from "shared";

export const updateUserAgencyRights = (
  user: ConnectedUser,
  requestedUpdate: UserParamsForAgency,
): ConnectedUser => {
  const remainingAgencyRights = user.agencyRights.filter(
    (agencyRight) => agencyRight.agency.id !== requestedUpdate.agencyId,
  );
  const updatedAgencyRight = user.agencyRights.find(
    (agencyRight) => agencyRight.agency.id === requestedUpdate.agencyId,
  );
  if (!updatedAgencyRight)
    throw errors.agency.notFound({ agencyId: requestedUpdate.agencyId });
  return {
    ...user,
    email: requestedUpdate.email,
    agencyRights: [
      ...remainingAgencyRights,
      {
        ...updatedAgencyRight,
        isNotifiedByEmail: requestedUpdate.isNotifiedByEmail,
        roles: requestedUpdate.roles,
      },
    ],
  };
};

export const hasCounsellorRoles = ({
  users,
  agencyId,
}: {
  users: {
    agencyRightsByAgencyId: Record<AgencyId, { roles: AgencyRole[] }>;
  }[];
  agencyId: AgencyId;
}): boolean =>
  users.some((user) =>
    user.agencyRightsByAgencyId[agencyId]?.roles.includes("counsellor"),
  );

export const toAgencyUserForListing = ({
  proConnect,
  dashboards: _,
  establishments: __,
  isBackofficeAdmin: ___,
  createdAt: ____,
  lastLoginAt: _____,
  preventToDelete: ______,
  agencyRights,
  ...user
}: ConnectedUser): AgencyUserForListing => ({
  ...user,
  isProConnectUser: proConnect !== null,
  agencyRightsByAgencyId: toAgencyRightsByAgencyId(agencyRights),
});
