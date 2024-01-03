import {
  PartialAgencyDto,
  UpdateAgencyStatusParams,
  updateAgencyStatusParamsSchema,
} from "shared";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../../core/eventBus/EventBus";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { throwConflictErrorOnSimilarAgencyFound } from "../../entities/Agency";

export class UpdateAgencyStatus extends TransactionalUseCase<
  UpdateAgencyStatusParams,
  void
> {
  protected inputSchema = updateAgencyStatusParamsSchema;

  #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
  }

  public async _execute(
    updateAgencyStatusParams: UpdateAgencyStatusParams,
    uow: UnitOfWork,
  ): Promise<void> {
    const existingAgency = await uow.agencyRepository.getById(
      updateAgencyStatusParams.id,
    );
    if (!existingAgency)
      throw new NotFoundError(
        `No agency found with id ${updateAgencyStatusParams.id}`,
      );

    await throwConflictErrorOnSimilarAgencyFound({
      uow,
      agency: existingAgency,
    });

    const updatedAgencyParams: PartialAgencyDto = {
      id: updateAgencyStatusParams.id,
      status: updateAgencyStatusParams.status,
      rejectionJustification:
        updateAgencyStatusParams.status === "rejected"
          ? updateAgencyStatusParams.rejectionJustification
          : undefined,
    };
    await uow.agencyRepository.update(updatedAgencyParams);

    if (
      updateAgencyStatusParams.status === "active" ||
      updateAgencyStatusParams.status === "rejected"
    ) {
      await uow.outboxRepository.save(
        this.#createNewEvent({
          topic:
            updateAgencyStatusParams.status === "active"
              ? "AgencyActivated"
              : "AgencyRejected",
          payload: { agency: { ...existingAgency, ...updatedAgencyParams } },
        }),
      );
    }
  }
}
