import { toPairs, uniq } from "ramda";
import {
  AgencyUsersRights,
  AgencyWithUsersRights,
  InclusionConnectedUser,
  WithAgencyId,
  errors,
  keys,
  withAgencyIdSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

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
    const updatedAgency = await uow.agencyRepository.getById(params.agencyId);

    if (!updatedAgency) throw errors.agency.notFound(params);

    const relatedAgencies =
      await uow.agencyRepository.getAgenciesRelatedToAgency(updatedAgency.id);

    await Promise.all(
      relatedAgencies.map(async ({ usersRights, id }) => {
        await uow.agencyRepository.update({
          id,
          usersRights: this.#updateRights(usersRights, updatedAgency),
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
    rightsOfRelatedAgency: AgencyUsersRights,
    updatedAgency: AgencyWithUsersRights,
  ): AgencyUsersRights {
    const validatorsOfUpdatedAgency = toPairs(updatedAgency.usersRights)
      .filter(([_, rights]) => rights?.roles.includes("validator"))
      .map(([id, rights]) => ({
        id,
        isNotifiedByEmail: rights?.isNotifiedByEmail,
      }));

    //TODO: de tête on a un utilitaire qui fait 2 en 1 ici
    const idsToUpdate = validatorsOfUpdatedAgency.filter(({ id }) =>
      keys(rightsOfRelatedAgency).includes(id),
    );
    const idsToAdd = validatorsOfUpdatedAgency.filter(
      ({ id }) => !keys(rightsOfRelatedAgency).includes(id),
    );
    const idsToRemove = toPairs(rightsOfRelatedAgency)
      .filter(
        ([id, rights]) =>
          rights?.roles.includes("validator") &&
          !validatorsOfUpdatedAgency.some((validator) => validator.id === id),
      )
      .map(([id]) => id);

    return {
      ...toPairs(rightsOfRelatedAgency).reduce<AgencyUsersRights>(
        (acc, [id, right]) => {
          const idToUpdate = idsToUpdate.find(
            (idToUpdate) => idToUpdate.id === id,
          );
          const isIdToRemove = idsToRemove.find(
            (idToRemove) => idToRemove === id,
          );
          return isIdToRemove
            ? acc
            : {
                ...acc,
                [id]:
                  right && idToUpdate
                    ? {
                        isNotifiedByEmail: idToUpdate.isNotifiedByEmail,
                        roles: uniq([...right.roles, "validator"]),
                      }
                    : right,
              };
        },
        {},
      ),
      ...idsToAdd.reduce<AgencyUsersRights>(
        (acc, idsToAdd) => ({
          ...acc,
          [idsToAdd.id]: {
            isNotifiedByEmail: idsToAdd.isNotifiedByEmail,
            roles: ["validator"],
          },
        }),
        {},
      ),
    };
  }
}
