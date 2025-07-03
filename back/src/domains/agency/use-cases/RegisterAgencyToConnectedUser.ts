import {
  type AgencyId,
  agencyIdsSchema,
  type ConnectedUserDomainJwtPayload,
  errors,
} from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class RegisterAgencyToConnectedUser extends TransactionalUseCase<
  AgencyId[],
  void,
  ConnectedUserDomainJwtPayload
> {
  protected inputSchema = agencyIdsSchema;

  #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
  }

  protected async _execute(
    agencyIds: AgencyId[],
    uow: UnitOfWork,
    connectedUserPayload: ConnectedUserDomainJwtPayload,
  ): Promise<void> {
    if (!connectedUserPayload) throw errors.user.noJwtProvided();

    const user = await uow.userRepository.getById(connectedUserPayload.userId);

    if (!user)
      throw errors.user.notFound({
        userId: connectedUserPayload.userId,
      });

    const agencyRights = await uow.agencyRepository.getAgenciesRightsByUserId(
      user.id,
    );
    const alreadyHasRequestedAgencyRight = agencyRights.filter((agencyRight) =>
      agencyIds.includes(agencyRight.agencyId),
    ).length;
    if (alreadyHasRequestedAgencyRight) {
      throw errors.user.alreadyHaveAgencyRights({
        userId: user.id,
      });
    }

    const agencies = await uow.agencyRepository.getByIds(agencyIds);

    await Promise.all([
      ...agencies.map(({ id, usersRights }) =>
        uow.agencyRepository.update({
          id,
          usersRights: {
            ...usersRights,
            [user.id]: {
              isNotifiedByEmail: false,
              roles: ["to-review"],
            },
          },
        }),
      ),
      uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "AgencyRegisteredToConnectedUser",
          payload: {
            userId: user.id,
            agencyIds,
            triggeredBy: {
              kind: "connected-user",
              userId: user.id,
            },
          },
        }),
      ),
    ]);
  }
}
