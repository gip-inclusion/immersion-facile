import {
  InclusionConnectedUser,
  WithAgencyIdAndUserId,
  errors,
  withAgencyIdAndUserIdSchema,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
import { oAuthProviderByFeatureFlags } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import {
  throwIfAgencyDontHaveOtherCounsellorsReceivingNotifications,
  throwIfAgencyDontHaveOtherValidatorsReceivingNotifications,
  throwIfAgencyRefersToAndUserIsValidator,
} from "../helpers/throwIfAgencyWontHaveEnoughCounsellorsOrValidators";
import { throwIfNotAdmin } from "../helpers/throwIfIcUserNotBackofficeAdmin";

export type RemoveUserFromAgency = ReturnType<typeof makeRemoveUserFromAgency>;

export const makeRemoveUserFromAgency = createTransactionalUseCase<
  WithAgencyIdAndUserId,
  void,
  InclusionConnectedUser,
  { createNewEvent: CreateNewEvent }
>(
  { name: "RemoveUserFromAgency", inputSchema: withAgencyIdAndUserIdSchema },
  async ({ currentUser, uow, inputParams: { agencyId, userId }, deps }) => {
    throwIfNotAdmin(currentUser);
    const user = await uow.userRepository.getById(
      userId,
      oAuthProviderByFeatureFlags(await uow.featureFlagRepository.getAll()),
    );
    if (!user) throw errors.user.notFound({ userId });

    const agency = await uow.agencyRepository.getById(agencyId);
    if (!agency) throw errors.agencies.notFound({ agencyIds: [agencyId] });

    const userRight = agency.usersRights[userId];
    if (!userRight)
      throw errors.user.expectedRightsOnAgency({
        agencyId,
        userId: user.id,
      });

    throwIfAgencyRefersToAndUserIsValidator(agency, user.id);
    throwIfAgencyDontHaveOtherValidatorsReceivingNotifications(agency, user.id);
    throwIfAgencyDontHaveOtherCounsellorsReceivingNotifications(
      agency,
      user.id,
    );

    const { [user.id]: _, ...usersRights } = agency.usersRights;

    await Promise.all([
      uow.agencyRepository.update({
        id: agency.id,
        usersRights,
      }),
      uow.outboxRepository.save(
        deps.createNewEvent({
          topic: "IcUserAgencyRightChanged",
          payload: {
            userId,
            agencyId,
            triggeredBy: {
              kind: "inclusion-connected",
              userId: currentUser.id,
            },
          },
        }),
      ),
    ]);
  },
);
