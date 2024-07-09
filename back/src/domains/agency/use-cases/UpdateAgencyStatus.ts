import {
  InclusionConnectedUser,
  PartialAgencyDto,
  UpdateAgencyStatusParams,
  errorMessages,
  updateAgencyStatusParamsSchema,
} from "shared";
import { NotFoundError } from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfNotAdmin } from "../../inclusion-connected-users/helpers/throwIfIcUserNotBackofficeAdmin";

export class UpdateAgencyStatus extends TransactionalUseCase<
  UpdateAgencyStatusParams,
  void,
  InclusionConnectedUser
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
    currentUser: InclusionConnectedUser,
  ): Promise<void> {
    throwIfNotAdmin(currentUser);
    const existingAgency = await uow.agencyRepository.getById(
      updateAgencyStatusParams.id,
    );
    if (!existingAgency)
      throw new NotFoundError(
        errorMessages.agency.notFound({
          agencyId: updateAgencyStatusParams.id,
        }),
      );

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
          payload: {
            agency: { ...existingAgency, ...updatedAgencyParams },
            triggeredBy: {
              kind: "inclusion-connected",
              userId: currentUser.id,
            },
          },
        }),
      );
    }
  }
}
