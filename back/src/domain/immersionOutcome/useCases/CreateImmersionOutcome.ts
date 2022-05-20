import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { ImmersionOutcomeDto } from "shared/src/immersionOutcome/ImmersionOutcomeDto";
import { immersionOutcomeSchema } from "shared/src/immersionOutcome/immersionOutcomeSchema";
import { MagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";

export class CreateImmersionOutcome extends TransactionalUseCase<
  ImmersionOutcomeDto,
  void,
  MagicLinkPayload
> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  inputSchema = immersionOutcomeSchema;

  public async _execute(
    dto: ImmersionOutcomeDto,
    uow: UnitOfWork,
    magicLinkPayload: MagicLinkPayload,
  ): Promise<void> {
    throwForbiddenIfNotAllow(dto, magicLinkPayload);
    const event = this.createNewEvent({
      topic: "ImmersionOutcomeCreated",
      payload: dto,
    });

    await Promise.all([
      uow.immersionOutcomeRepository.save(dto),
      uow.outboxRepo.save(event),
    ]);
  }
}

const throwForbiddenIfNotAllow = (
  dto: ImmersionOutcomeDto,
  magicLinkPayload: MagicLinkPayload,
) => {
  if (
    !magicLinkPayload ||
    magicLinkPayload.role !== "establishment" ||
    dto.conventionId !== magicLinkPayload.applicationId
  )
    throw new ForbiddenError();
};
