import { InclusionConnectedUser, OAuthGatewayProvider, errors } from "shared";
import { getAgencyRightByUserId } from "../../../utils/agency";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";

export const getIcUserByUserId = async (
  uow: UnitOfWork,
  provider: OAuthGatewayProvider,
  userId: string,
): Promise<InclusionConnectedUser> => {
  const user = await uow.userRepository.getById(userId, provider);
  if (!user) throw errors.user.notFound({ userId });

  return {
    ...user,
    agencyRights: await getAgencyRightByUserId(uow, provider, user.id),
    dashboards: { agencies: {}, establishments: {} },
  };
};
