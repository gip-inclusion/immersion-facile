import {
  ConventionJwtPayload,
  ImmersionAssessmentDto,
  immersionAssessmentSchema,
} from "shared";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CreateNewEvent } from "../../core/eventBus/EventBus";
import { UnitOfWork, UnitOfWorkPerformer } from "../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../core/UseCase";
import {
  createImmersionAssessmentEntity,
  ImmersionAssessmentEntity,
} from "../entities/ImmersionAssessmentEntity";

export class CreateImmersionAssessment extends TransactionalUseCase<ImmersionAssessmentDto> {
  inputSchema = immersionAssessmentSchema;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  public async _execute(
    dto: ImmersionAssessmentDto,
    uow: UnitOfWork,
    magicLinkPayload: ConventionJwtPayload,
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
      uow.outboxRepository.save(event),
    ]);
  }
}

const validateConventionAndCreateImmersionAssessmentEntity = async (
  uow: UnitOfWork,
  dto: ImmersionAssessmentDto,
): Promise<ImmersionAssessmentEntity> => {
  const conventionId = dto.conventionId;
  const convention = await uow.conventionRepository.getById(conventionId);

  if (!convention)
    throw new NotFoundError(
      `Did not found convention with id: ${conventionId}`,
    );

  const assessment = await uow.immersionAssessmentRepository.getByConventionId(
    conventionId,
  );

  if (assessment)
    throw new ConflictError(
      `Cannot create an assessment as one already exists for convention with id : ${conventionId}`,
    );

  return createImmersionAssessmentEntity(dto, convention);
};

const throwForbiddenIfNotAllow = (
  dto: ImmersionAssessmentDto,
  magicLinkPayload: ConventionJwtPayload,
) => {
  if (!magicLinkPayload) throw new ForbiddenError("No magic link provided");
  if (magicLinkPayload.role !== "establishment")
    throw new ForbiddenError("Only an establishment can create an assessment");
  if (dto.conventionId !== magicLinkPayload.applicationId)
    throw new ForbiddenError(
      "Convention provided in DTO is not the same as application linked to it",
    );
};
