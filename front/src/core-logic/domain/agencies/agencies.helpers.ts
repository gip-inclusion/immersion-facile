import { InclusionConnectedUser, UserParamsForAgency, errors } from "shared";

export const updateUserAgencyRights = (
  user: InclusionConnectedUser,
  requestedUpdate: UserParamsForAgency,
): InclusionConnectedUser => {
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
