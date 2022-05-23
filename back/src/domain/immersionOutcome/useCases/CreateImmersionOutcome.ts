import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { ImmersionOutcomeDto } from "shared/src/immersionOutcome/ImmersionOutcomeDto";
import { immersionOutcomeSchema } from "shared/src/immersionOutcome/immersionOutcomeSchema";
import { MagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import {
  createImmersionOutcomeEntity,
  ImmersionOutcomeEntity,
} from "../entities/ImmersionOutcomeEntity";

export class CreateImmersionOutcome extends TransactionalUseCase<ImmersionOutcomeDto> {
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

    const immersionOutcomeEntity =
      await validateConventionAndCreateImmersionOutcomeEntity(uow, dto);

    const event = this.createNewEvent({
      topic: "ImmersionOutcomeCreated",
      payload: dto,
    });

    await Promise.all([
      uow.immersionOutcomeRepository.save(immersionOutcomeEntity),
      uow.outboxRepo.save(event),
    ]);
  }
}

const validateConventionAndCreateImmersionOutcomeEntity = async (
  uow: UnitOfWork,
  dto: ImmersionOutcomeDto,
): Promise<ImmersionOutcomeEntity> => {
  const convention = await uow.immersionApplicationRepo.getById(
    dto.conventionId,
  );

  if (!convention)
    throw new NotFoundError(
      `Did not found convention with id: ${dto.conventionId}`,
    );

  return createImmersionOutcomeEntity(dto, convention);
};

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
