import { AssessmentDto, ConventionJwtPayload, assessmentSchema } from "shared";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from "../../../config/helpers/httpErrors";
import { TransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";
import {
  AssessmentEntity,
  createAssessmentEntity,
} from "../entities/AssessmentEntity";

export class CreateAssessment extends TransactionalUseCase<AssessmentDto> {
  protected inputSchema = assessmentSchema;

  #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
  }

  public async _execute(
    dto: AssessmentDto,
    uow: UnitOfWork,
    conventionJwtPayload?: ConventionJwtPayload,
  ): Promise<void> {
    if (!conventionJwtPayload)
      throw new ForbiddenError("No magic link provided");
    throwForbiddenIfNotAllow(dto, conventionJwtPayload);

    const assessmentEntity = await validateConventionAndCreateAssessmentEntity(
      uow,
      dto,
    );

    const event = this.#createNewEvent({
      topic: "AssessmentCreated",
      payload: {
        assessment: dto,
        triggeredBy: {
          kind: "convention-magic-link",
          role: conventionJwtPayload.role,
        },
      },
    });

    await Promise.all([
      uow.assessmentRepository.save(assessmentEntity),
      uow.outboxRepository.save(event),
    ]);
  }
}

const validateConventionAndCreateAssessmentEntity = async (
  uow: UnitOfWork,
  dto: AssessmentDto,
): Promise<AssessmentEntity> => {
  const conventionId = dto.conventionId;
  const convention = await uow.conventionRepository.getById(conventionId);

  if (!convention)
    throw new NotFoundError(
      `Did not found convention with id: ${conventionId}`,
    );

  const assessment =
    await uow.assessmentRepository.getByConventionId(conventionId);

  if (assessment)
    throw new ConflictError(
      `Cannot create an assessment as one already exists for convention with id : ${conventionId}`,
    );

  return createAssessmentEntity(dto, convention);
};

const throwForbiddenIfNotAllow = (
  dto: AssessmentDto,
  conventionJwtPayload: ConventionJwtPayload,
) => {
  if (conventionJwtPayload.role !== "establishment-tutor")
    throw new ForbiddenError(
      "Only an establishment tutor can create an assessment",
    );
  if (dto.conventionId !== conventionJwtPayload.applicationId)
    throw new ForbiddenError(
      "Convention provided in DTO is not the same as application linked to it",
    );
};
