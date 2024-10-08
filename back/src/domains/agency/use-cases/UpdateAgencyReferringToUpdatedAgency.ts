import {
  AgencyDto,
  InclusionConnectedUser,
  WithAgencyDto,
  withAgencySchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class UpdateAgencyReferringToUpdatedAgency extends TransactionalUseCase<
  WithAgencyDto,
  void,
  InclusionConnectedUser
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
    const updatedRelatedAgencies: AgencyDto[] = (
      await uow.agencyRepository.getAgenciesRelatedToAgency(params.agency.id)
    ).map((agency) => ({
      ...agency,
      validatorEmails: params.agency.validatorEmails,
    }));

    await Promise.all(
      updatedRelatedAgencies.flatMap((agency) => [
        uow.agencyRepository.update(agency),
        uow.outboxRepository.save(
          this.#createNewEvent({
            topic: "AgencyUpdated",
            payload: {
              agency,
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
