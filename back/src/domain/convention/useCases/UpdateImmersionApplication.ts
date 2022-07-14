import {
  ConventionStatus,
  UpdateConventionRequestDto,
  WithConventionId,
} from "shared/src/convention/convention.dto";
import { updateConventionRequestSchema } from "shared/src/convention/convention.schema";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";

//TODO UpdateConventionAfterModifications request
// should receive a convention with draft status
// for now the frontend send a status with READY_TO_SIGN, it will be inverted after refacto
// https://trello.com/c/siRQLkeU
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
      // params.convention.status != "DRAFT" &&
      params.convention.status != minimalValidStatus
    ) {
      throw new ForbiddenError(
        `Convention ${params.convention.id} with modifications should have status READY_TO_SIGN`,
      );
    }

    const conventionFromRepo = await uow.conventionRepository.getById(
      params.id,
    );
    if (!conventionFromRepo)
      throw new NotFoundError(`Convention with id ${params.id} was not found`);

    if (conventionFromRepo.status != "DRAFT") {
      throw new BadRequestError(
        `Convention ${conventionFromRepo.id} cannot be modified as it has status ${conventionFromRepo.status}`,
      );
    }

    await Promise.all([
      uow.conventionRepository.update(params.convention),
      uow.outboxRepository.save(
        this.createNewEvent({
          topic: "ConventionSubmittedAfterModification",
          payload: params.convention,
        }),
      ),
    ]);

    return { id: conventionFromRepo.id };
  }
}
