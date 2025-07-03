import {
  type ConnectedUser,
  errors,
  type PartialAgencyDto,
  type UpdateAgencyStatusParams,
  updateAgencyStatusParamsSchema,
} from "shared";
import { throwIfNotAdmin } from "../../connected-users/helpers/authorization.helper";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import { TransactionalUseCase } from "../../core/UseCase";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class UpdateAgencyStatus extends TransactionalUseCase<
  UpdateAgencyStatusParams,
  void,
  ConnectedUser
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
    currentUser: ConnectedUser,
  ): Promise<void> {
    throwIfNotAdmin(currentUser);
    const existingAgency = await uow.agencyRepository.getById(
      updateAgencyStatusParams.id,
    );
    if (!existingAgency)
      throw errors.agency.notFound({
        agencyId: updateAgencyStatusParams.id,
      });

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
            agencyId: existingAgency.id,
            triggeredBy: {
              kind: "connected-user",
              userId: currentUser.id,
            },
          },
        }),
      );
    }
  }
}
