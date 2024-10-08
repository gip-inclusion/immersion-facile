import {
  AgencyDto,
  AgencyId,
  InclusionConnectedUser,
  OAuthGatewayProvider,
  RemoveAgencyUserParams,
  UserId,
  errors,
  removeAgencyUserParamsSchema,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
import { oAuthProviderByFeatureFlags } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { UserRepository } from "../../core/authentication/inclusion-connect/port/UserRepository";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import {
  throwIfAgencyDontHaveOtherCounsellorsReceivingNotifications,
  throwIfAgencyDontHaveOtherValidatorsReceivingNotifications,
} from "../helpers/throwIfAgencyWontHaveEnoughCounsellorsOrValidators";
import { throwIfNotAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

export type RemoveUserFromAgency = ReturnType<typeof makeRemoveUserFromAgency>;

const getUserAndThrowIfNotFound = async (
  userRepository: UserRepository,
  userId: UserId,
  provider: OAuthGatewayProvider,
): Promise<InclusionConnectedUser> => {
  const requestedUser = await userRepository.getById(userId, provider);
  if (!requestedUser) throw errors.user.notFound({ userId });
  return requestedUser;
};

const getUserAgencyRightsAndThrowIfUserHasNoAgencyRight = (
  user: InclusionConnectedUser,
  agencyId: AgencyId,
): AgencyDto => {
  const userRight = user.agencyRights.find(
    (agencyRight) => agencyRight.agency.id === agencyId,
  );

  if (!userRight)
    throw errors.user.expectedRightsOnAgency({
      agencyId,
      userId: user.id,
    });

  return userRight.agency;
};

export const makeRemoveUserFromAgency = createTransactionalUseCase<
  RemoveAgencyUserParams,
  void,
  InclusionConnectedUser,
  { createNewEvent: CreateNewEvent }
>(
  { name: "RemoveUserFromAgency", inputSchema: removeAgencyUserParamsSchema },
  async ({ currentUser, uow, inputParams }) => {
    const provider = oAuthProviderByFeatureFlags(
      await uow.featureFlagRepository.getAll(),
    );
    throwIfNotAdmin(currentUser);
    const requestedUser = await getUserAndThrowIfNotFound(
      uow.userRepository,
      inputParams.userId,
      provider,
    );
    const agency = getUserAgencyRightsAndThrowIfUserHasNoAgencyRight(
      requestedUser,
      inputParams.agencyId,
    );
    await throwIfAgencyDontHaveOtherValidatorsReceivingNotifications(
      uow,
      agency,
      inputParams.userId,
      provider,
    );
    await throwIfAgencyDontHaveOtherCounsellorsReceivingNotifications(
      uow,
      agency,
      inputParams.userId,
      provider,
    );

    const filteredAgencyRights = requestedUser.agencyRights.filter(
      (agencyRight) => agencyRight.agency.id !== inputParams.agencyId,
    );

    await uow.userRepository.updateAgencyRights({
      userId: inputParams.userId,
      agencyRights: filteredAgencyRights,
    });
  },
);
