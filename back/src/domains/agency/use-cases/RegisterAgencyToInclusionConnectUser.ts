import {
  type AgencyId,
  agencyIdsSchema,
  errors,
  type InclusionConnectDomainJwtPayload,
} from "shared";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class RegisterAgencyToInclusionConnectUser extends TransactionalUseCase<
  AgencyId[],
  void,
  InclusionConnectDomainJwtPayload
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
    inclusionConnectedPayload: InclusionConnectDomainJwtPayload,
  ): Promise<void> {
    if (!inclusionConnectedPayload) throw errors.user.noJwtProvided();

    const user = await uow.userRepository.getById(
      inclusionConnectedPayload.userId,
    );

    if (!user)
      throw errors.user.notFound({
        userId: inclusionConnectedPayload.userId,
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
          topic: "AgencyRegisteredToInclusionConnectedUser",
          payload: {
            userId: user.id,
            agencyIds,
            triggeredBy: {
              kind: "inclusion-connected",
              userId: user.id,
            },
          },
        }),
      ),
    ]);
  }
}
