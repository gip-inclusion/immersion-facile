import { AgencyDto, WithAgencyId, errors, withAgencyIdSchema } from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class UpdateAgencyReferringToUpdatedAgency extends TransactionalUseCase<WithAgencyId> {
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
    const agencyUpdated = await uow.agencyRepository.getById(params.agencyId);
    if (!agencyUpdated) throw errors.agency.notFound(params);
    const updatedRelatedAgencies: AgencyDto[] = (
      await uow.agencyRepository.getAgenciesRelatedToAgency(agencyUpdated.id)
    ).map((agency) => ({
      ...agency,
      validatorEmails: agencyUpdated.validatorEmails,
    }));

    if (updatedRelatedAgencies.length === 0) return;
    // TODO : handle validators not receiving notifications BUT Only after Ben refacto

    await Promise.all(
      updatedRelatedAgencies.flatMap((agency) => [
        uow.agencyRepository.update(agency),
        uow.outboxRepository.save(
          this.#createNewEvent({
            topic: "AgencyUpdated",
            payload: {
              agencyId: agency.id,
              triggeredBy: {
                kind: "crawler",
              },
            },
          }),
        ),
      ]),
    );
  }
}
