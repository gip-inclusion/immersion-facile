import {
  type InclusionConnectedUser,
  type WithAgencyIdAndUserId,
  errors,
  withAgencyIdAndUserIdSchema,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import {
  rejectIfEditionOfValidatorsOfAgencyWithRefersTo,
  validateAgencyRights,
} from "../helpers/agencyRights.helper";
import { throwIfNotAgencyAdminOrBackofficeAdmin } from "../helpers/authorization.helper";

export type RemoveUserFromAgency = ReturnType<typeof makeRemoveUserFromAgency>;

export const makeRemoveUserFromAgency = createTransactionalUseCase<
  WithAgencyIdAndUserId,
  void,
  InclusionConnectedUser,
  { createNewEvent: CreateNewEvent }
>(
  { name: "RemoveUserFromAgency", inputSchema: withAgencyIdAndUserIdSchema },
  async ({ currentUser, uow, inputParams: { agencyId, userId }, deps }) => {
    const isUserHimself = currentUser.id === userId;
    if (!isUserHimself)
      throwIfNotAgencyAdminOrBackofficeAdmin(agencyId, currentUser);

    const user = await uow.userRepository.getById(userId);
    if (!user) throw errors.user.notFound({ userId });

    const agency = await uow.agencyRepository.getById(agencyId);
    if (!agency) throw errors.agency.notFound({ agencyId });

    const userRight = agency.usersRights[userId];
    if (!userRight)
      throw errors.user.expectedRightsOnAgency({
        agencyId,
        userId: user.id,
      });

    rejectIfEditionOfValidatorsOfAgencyWithRefersTo(agency, userRight.roles);

    const { [user.id]: _, ...usersRights } = agency.usersRights;

    validateAgencyRights(agency.id, usersRights, agency.refersToAgencyId);

    await uow.agencyRepository.update({
      id: agency.id,
      usersRights,
    });

    await uow.outboxRepository.save(
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
    );
  },
);
