import { AgencyDto, WithAgencyDto, withAgencySchema } from "shared";
import { TransactionalUseCase } from "../../../core/UseCase";
import { CreateNewEvent } from "../../../core/eventBus/EventBus";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";

export class UpdateAgencyReferingToUpdatedAgency extends TransactionalUseCase<
  WithAgencyDto,
  void
> {
  protected inputSchema = withAgencySchema;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
  }

  public async _execute(params: WithAgencyDto, uow: UnitOfWork): Promise<void> {
    const updatedReleatedAgencies: AgencyDto[] = (
      await uow.agencyRepository.getAgenciesRelatedToAgency(params.agency.id)
    ).map((agency) => ({
      ...agency,
      validatorEmails: params.agency.validatorEmails,
    }));

    await Promise.all(
      updatedReleatedAgencies.flatMap((agency) => [
        uow.agencyRepository.update(agency),
        uow.outboxRepository.save(
          this.#createNewEvent({
            topic: "AgencyUpdated",
            payload: { agency },
          }),
        ),
      ]),
    );
  }
}
