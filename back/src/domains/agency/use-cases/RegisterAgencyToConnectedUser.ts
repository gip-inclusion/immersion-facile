import { agencyIdsSchema, type ConnectedUser, errors } from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export type RegisterAgencyToConnectedUser = ReturnType<
  typeof makeRegisterAgencyToConnectedUser
>;
export const makeRegisterAgencyToConnectedUser = useCaseBuilder(
  "RegisterAgencyToConnectedUser",
)
  .withInput(agencyIdsSchema)
  .withCurrentUser<ConnectedUser>()
  .withDeps<{ createNewEvent: CreateNewEvent }>()
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
      ...agencies.map(({ id, usersRights }) =>
        uow.agencyRepository.update({
          id,
          usersRights: {
            ...usersRights,
            [currentUser.id]: {
              isNotifiedByEmail: false,
              roles: ["to-review"],
            },
          },
        }),
      ),
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
