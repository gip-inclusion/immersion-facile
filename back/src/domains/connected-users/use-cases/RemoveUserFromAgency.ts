import {
  type ConnectedUser,
  errors,
  type WithAgencyIdAndUserId,
  withAgencyIdAndUserIdSchema,
} from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import {
  rejectIfEditionOfValidatorsOfAgencyWithRefersTo,
  validateAgencyRights,
} from "../helpers/agencyRights.helper";
import { throwIfNotAgencyAdminOrBackofficeAdmin } from "../helpers/authorization.helper";

export type RemoveUserFromAgency = ReturnType<typeof makeRemoveUserFromAgency>;

export const makeRemoveUserFromAgency = useCaseBuilder("RemoveUserFromAgency")
  .withInput<WithAgencyIdAndUserId>(withAgencyIdAndUserIdSchema)
  .withCurrentUser<ConnectedUser>()
  .withDeps<{ createNewEvent: CreateNewEvent; timeGateway: TimeGateway }>()
  .build(
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

      const phoneId = await uow.phoneNumberRepository.getIdByPhoneNumber(
        agency.phoneNumber,
        deps.timeGateway.now(),
      );

      await uow.agencyRepository.update({
        partialAgency: {
          id: agency.id,
          usersRights,
        },
        newPhoneId: phoneId,
      });

      await uow.outboxRepository.save(
        deps.createNewEvent({
          topic: "ConnectedUserAgencyRightChanged",
          payload: {
            userId,
            agencyId,
            triggeredBy: {
              kind: "connected-user",
              userId: currentUser.id,
            },
          },
        }),
      );
    },
  );
