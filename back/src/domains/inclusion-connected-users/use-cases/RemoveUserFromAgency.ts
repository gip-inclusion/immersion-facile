import {
  AgencyId,
  InclusionConnectedUser,
  WithAgencyIdAndUserId,
  errors,
  withAgencyIdAndUserIdSchema,
} from "shared";
import { AgencyWithUsersRights } from "../../agency/ports/AgencyRepository";
import { createTransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import {
  throwIfAgencyDontHaveOtherCounsellorsReceivingNotifications,
  throwIfAgencyDontHaveOtherValidatorsReceivingNotifications,
} from "../helpers/throwIfAgencyWontHaveEnoughCounsellorsOrValidators";
import {
  getIcUserOrThrow,
  throwIfNotAdmin,
} from "../helpers/throwIfIcUserNotBackofficeAdmin";

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
    const agency = await getUserAgencyRightsAndThrowIfUserHasNoAgencyRight(
      uow,
      await getIcUserOrThrow(uow, userId),
      agencyId,
    );
    throwIfAgencyDontHaveOtherValidatorsReceivingNotifications(agency, userId);
    throwIfAgencyDontHaveOtherCounsellorsReceivingNotifications(agency, userId);

    const { [userId]: _, ...usersRights } = agency.usersRights;

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

const getUserAgencyRightsAndThrowIfUserHasNoAgencyRight = async (
  uow: UnitOfWork,
  user: InclusionConnectedUser,
  agencyId: AgencyId,
): Promise<AgencyWithUsersRights> => {
  const userRight = user.agencyRights.find(
    (agencyRight) => agencyRight.agency.id === agencyId,
  );

  if (!userRight)
    throw errors.user.expectedRightsOnAgency({
      agencyId,
      userId: user.id,
    });
  const agency = await uow.agencyRepository.getById(agencyId);
  if (!agency) throw errors.agencies.notFound({ agencyIds: [agencyId] });
  return agency;
};
