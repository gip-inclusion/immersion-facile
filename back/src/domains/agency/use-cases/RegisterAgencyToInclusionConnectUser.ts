import {
  AgencyId,
  InclusionConnectDomainJwtPayload,
  agencyIdsSchema,
  errors,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { oAuthProviderByFeatureFlags } from "../../core/authentication/inclusion-connect/port/OAuthGateway";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

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
      oAuthProviderByFeatureFlags(await uow.featureFlagRepository.getAll()),
    );

    if (!user)
      throw errors.user.notFound({
        userId: inclusionConnectedPayload.userId,
      });

    const agencyRights = await uow.agencyRepository.getAgenciesRightsByUserId(
      user.id,
    );
    if (agencyRights.length > 0) {
      throw errors.user.alreadyHaveAgencyRights({
        userId: user.id,
      });
    }

    const agencies = await uow.agencyRepository.getByIds(agencyIds);
    if (agencies.length !== agencyIds.length) {
      throw errors.agencies.notFound({
        agencyIds: agencies.map((agency) => agency.id),
      });
    }

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
