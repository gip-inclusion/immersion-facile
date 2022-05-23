import {
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import { ImmersionAssessmentDto } from "shared/src/immersionAssessment/ImmersionAssessmentDto";
import { immersionAssessmentSchema } from "shared/src/immersionAssessment/immersionAssessmentSchema";
import { MagicLinkPayload } from "shared/src/tokens/MagicLinkPayload";
import {
  createImmersionAssessmentEntity,
  ImmersionAssessmentEntity,
} from "../entities/ImmersionAssessmentEntity";

export class CreateImmersionAssessment extends TransactionalUseCase<ImmersionAssessmentDto> {
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  inputSchema = immersionAssessmentSchema;

  public async _execute(
    dto: ImmersionAssessmentDto,
    uow: UnitOfWork,
    magicLinkPayload: MagicLinkPayload,
  ): Promise<void> {
    throwForbiddenIfNotAllow(dto, magicLinkPayload);

    const immersionAssessmentEntity =
      await validateConventionAndCreateImmersionAssessmentEntity(uow, dto);

    const event = this.createNewEvent({
      topic: "ImmersionAssessmentCreated",
      payload: dto,
    });

    await Promise.all([
      uow.immersionAssessmentRepository.save(immersionAssessmentEntity),
      uow.outboxRepo.save(event),
    ]);
  }
}

const validateConventionAndCreateImmersionAssessmentEntity = async (
  uow: UnitOfWork,
  dto: ImmersionAssessmentDto,
): Promise<ImmersionAssessmentEntity> => {
  const convention = await uow.immersionApplicationRepo.getById(
    dto.conventionId,
  );

  if (!convention)
    throw new NotFoundError(
      `Did not found convention with id: ${dto.conventionId}`,
    );

  return createImmersionAssessmentEntity(dto, convention);
};

const throwForbiddenIfNotAllow = (
  dto: ImmersionAssessmentDto,
  magicLinkPayload: MagicLinkPayload,
) => {
  if (
    !magicLinkPayload ||
    magicLinkPayload.role !== "establishment" ||
    dto.conventionId !== magicLinkPayload.applicationId
  )
    throw new ForbiddenError();
};
