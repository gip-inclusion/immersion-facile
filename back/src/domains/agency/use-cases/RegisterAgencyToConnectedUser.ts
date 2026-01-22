import { agencyIdsSchema, type ConnectedUser, errors } from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type RegisterAgencyToConnectedUser = ReturnType<
  typeof makeRegisterAgencyToConnectedUser
>;
export const makeRegisterAgencyToConnectedUser = useCaseBuilder(
  "RegisterAgencyToConnectedUser",
)
  .withInput(agencyIdsSchema)
  .withCurrentUser<ConnectedUser>()
  .withDeps<{ createNewEvent: CreateNewEvent; timeGateway: TimeGateway }>()
  .build(async ({ uow, currentUser, deps, inputParams: agencyIds }) => {
    const agencyRights = await uow.agencyRepository.getAgenciesRightsByUserId(
      currentUser.id,
    );
    const alreadyHasRequestedAgencyRight = agencyRights.filter((agencyRight) =>
      agencyIds.includes(agencyRight.agencyId),
    ).length;
    if (alreadyHasRequestedAgencyRight) {
      throw errors.user.alreadyHaveAgencyRights({
        userId: currentUser.id,
      });
    }

    const agencies = await uow.agencyRepository.getByIds(agencyIds);

    await Promise.all([
      ...agencies.map(async ({ id, usersRights, phoneNumber }) => {
        const phoneId = await uow.phoneNumberRepository.getIdByPhoneNumber(
          phoneNumber,
          deps.timeGateway.now(),
        );
        return uow.agencyRepository.update({
          partialAgency: {
            id,
            usersRights: {
              ...usersRights,
              [currentUser.id]: {
                isNotifiedByEmail: false,
                roles: ["to-review"],
              },
            },
          },
          newPhoneId: phoneId,
        });
      }),
      uow.outboxRepository.save(
        deps.createNewEvent({
          topic: "AgencyRegisteredToConnectedUser",
          payload: {
            userId: currentUser.id,
            agencyIds,
            triggeredBy: {
              kind: "connected-user",
              userId: currentUser.id,
            },
          },
        }),
      ),
    ]);
  });
