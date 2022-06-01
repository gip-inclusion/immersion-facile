import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import {
  ConventionStatus,
  UpdateConventionRequestDto,
  WithConventionId,
} from "shared/src/convention/convention.dto";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { ConventionEntity } from "../entities/ConventionEntity";
import { updateConventionRequestSchema } from "shared/src/convention/convention.schema";

export class UpdateImmersionApplication extends TransactionalUseCase<
  UpdateConventionRequestDto,
  WithConventionId
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  inputSchema = updateConventionRequestSchema;

  public async _execute(
    params: UpdateConventionRequestDto,
    uow: UnitOfWork,
  ): Promise<WithConventionId> {
    const minimalValidStatus: ConventionStatus = "READY_TO_SIGN";

    if (
      params.convention.status != "DRAFT" &&
      params.convention.status != minimalValidStatus
    ) {
      throw new ForbiddenError();
    }

    const conventionEntity = ConventionEntity.create(params.convention);

    const currentApplication = await uow.conventionRepository.getById(
      params.id,
    );
    if (!currentApplication) throw new NotFoundError(params.id);
    if (currentApplication.status != "DRAFT") {
      throw new BadRequestError(currentApplication.status);
    }
    const id = await uow.conventionRepository.update(conventionEntity);
    if (!id) throw new NotFoundError(params.id);

    if (params.convention.status === minimalValidStatus) {
      // So far we are in the case where a beneficiary made an update on an Immersion Application, and we just need to review it for eligibility
      const event = this.createNewEvent({
        topic: "ImmersionApplicationSubmittedByBeneficiary",
        payload: params.convention,
      });

      await uow.outboxRepo.save(event);
    }

    return { id };
  }
}
