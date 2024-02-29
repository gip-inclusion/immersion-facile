import {
  BackOfficeJwtPayload,
  PartialAgencyDto,
  UpdateAgencyStatusParams,
  updateAgencyStatusParamsSchema,
} from "shared";
import {
  NotFoundError,
  UnauthorizedError,
} from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwConflictErrorOnSimilarAgencyFound } from "../entities/Agency";

export class UpdateAgencyStatus extends TransactionalUseCase<
  UpdateAgencyStatusParams,
  void,
  BackOfficeJwtPayload
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
    jwtPayload?: BackOfficeJwtPayload,
  ): Promise<void> {
    if (!jwtPayload) throw new UnauthorizedError();
    const existingAgency = await uow.agencyRepository.getById(
      updateAgencyStatusParams.id,
    );
    if (!existingAgency)
      throw new NotFoundError(
        `No agency found with id ${updateAgencyStatusParams.id}`,
      );

    if (jwtPayload.role !== "backOffice") {
      await throwConflictErrorOnSimilarAgencyFound({
        uow,
        agency: existingAgency,
      });
    }

    const updatedAgencyParams: PartialAgencyDto = {
      id: updateAgencyStatusParams.id,
      status: updateAgencyStatusParams.status,
      rejectionJustification:
        updateAgencyStatusParams.status === "rejected"
          ? updateAgencyStatusParams.rejectionJustification
          : null,
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
