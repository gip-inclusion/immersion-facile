import {
  ConventionStatus,
  UpdateConventionRequestDto,
  WithConventionIdLegacy,
  updateConventionRequestSchema,
} from "shared";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export class UpdateConvention extends TransactionalUseCase<
  UpdateConventionRequestDto,
  WithConventionIdLegacy
> {
  protected inputSchema = updateConventionRequestSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    { convention }: UpdateConventionRequestDto,
    uow: UnitOfWork,
  ): Promise<WithConventionIdLegacy> {
    const minimalValidStatus: ConventionStatus = "READY_TO_SIGN";

    if (convention.status !== minimalValidStatus)
      throw new ForbiddenError(
        `Convention ${convention.id} with modifications should have status ${minimalValidStatus}`,
      );

    const conventionFromRepo = await uow.conventionRepository.getById(
      convention.id,
    );

    if (!conventionFromRepo)
      throw new NotFoundError(
        `Convention with id ${convention.id} was not found`,
      );
    if (conventionFromRepo.status !== "DRAFT") {
      throw new BadRequestError(
        `Convention ${conventionFromRepo.id} cannot be modified as it has status ${conventionFromRepo.status}`,
      );
    }

    await Promise.all([
      uow.conventionRepository.update(convention),
      uow.outboxRepository.save(
        this.createNewEvent({
          topic: "ConventionSubmittedAfterModification",
          payload: { convention },
        }),
      ),
    ]);

    return { id: conventionFromRepo.id };
  }
}