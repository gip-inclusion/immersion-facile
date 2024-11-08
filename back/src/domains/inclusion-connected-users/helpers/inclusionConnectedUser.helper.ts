import { InclusionConnectedUser, UserId, errors } from "shared";
import { getAgencyRightByUserId } from "../../../utils/agency";
import { makeProvider } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export const getIcUserByUserId = async (
  uow: UnitOfWork,
  userId: UserId,
): Promise<InclusionConnectedUser> => {
  const user = await uow.userRepository.getById(
    userId,
    await makeProvider(uow),
  );
  if (!user) throw errors.user.notFound({ userId });
  return {
    ...user,
    agencyRights: await getAgencyRightByUserId(uow, user.id),
    dashboards: { agencies: {}, establishments: {} },
  };
};
