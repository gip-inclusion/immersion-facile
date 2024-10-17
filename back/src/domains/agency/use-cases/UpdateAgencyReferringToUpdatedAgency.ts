import { toPairs, uniq } from "ramda";
import {
  InclusionConnectedUser,
  UserId,
  WithAgencyId,
  errors,
  keys,
  withAgencyIdSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { AgencyUsersRights } from "../ports/AgencyRepository";

export class UpdateAgencyReferringToUpdatedAgency extends TransactionalUseCase<
  WithAgencyId,
  void,
  InclusionConnectedUser
> {
  protected inputSchema = withAgencyIdSchema;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
  }

  public async _execute(params: WithAgencyId, uow: UnitOfWork): Promise<void> {
    const agency = await uow.agencyRepository.getById(params.agencyId);

    if (!agency) throw errors.agency.notFound(params);

    const validatorsNotNotifiedToCopyIds = toPairs(agency.usersRights)
      .filter(
        ([_, rights]) =>
          rights?.roles.includes("validator") &&
          rights.isNotifiedByEmail === false,
      )
      .map(([id]) => id);

    const relatedAgencies =
      await uow.agencyRepository.getAgenciesRelatedToAgency(agency.id);

    await Promise.all(
      relatedAgencies.map(async ({ usersRights, id }) => {
        await uow.agencyRepository.update({
          id,
          usersRights: this.#updateRights(
            usersRights,
            validatorsNotNotifiedToCopyIds,
          ),
        });
        await uow.outboxRepository.save(
          this.#createNewEvent({
            topic: "AgencyUpdated",
            payload: {
              agencyId: id,
              triggeredBy: {
                kind: "crawler",
              },
            },
          }),
        );
      }),
    );
  }

  #updateRights(
    rights: AgencyUsersRights,
    validatorsNotNotifiedToCopyIds: UserId[],
  ): AgencyUsersRights {
    //TODO: de tête on a un utilitaire qui fait 2 en 1 ici
    const idsToUpdate: UserId[] = validatorsNotNotifiedToCopyIds.filter((id) =>
      keys(rights).includes(id),
    );
    const idsToAdd: UserId[] = validatorsNotNotifiedToCopyIds.filter(
      (id) => !keys(rights).includes(id),
    );

    return {
      ...toPairs(rights).reduce<AgencyUsersRights>(
        (acc, [id, right]) => ({
          ...acc,
          [id]:
            right && idsToUpdate.includes(id)
              ? {
                  isNotifiedByEmail: right.isNotifiedByEmail,
                  roles: uniq([...right.roles, "validator"]),
                }
              : right,
        }),
        {},
      ),
      ...idsToAdd.reduce<AgencyUsersRights>(
        (acc, id) => ({
          ...acc,
          [id]: { isNotifiedByEmail: false, roles: ["validator"] },
        }),
        {},
      ),
    };
  }
}
