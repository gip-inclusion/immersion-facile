import {
  type InclusionConnectedUser,
  type PartialAgencyDto,
  type UpdateAgencyStatusParams,
  errors,
  updateAgencyStatusParamsSchema,
} from "shared";
import { TransactionalUseCase } from "../../core/UseCase";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import { throwIfNotAdmin } from "../../inclusion-connected-users/helpers/authorization.helper";

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
              kind: "inclusion-connected",
              userId: currentUser.id,
            },
          },
        }),
      );
    }
  }
}
