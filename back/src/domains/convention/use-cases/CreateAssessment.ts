import { AssessmentDto, ConventionJwtPayload, assessmentSchema } from "shared";
import { ConflictError, ForbiddenError, NotFoundError } from "shared";
import { throwForbiddenIfNotAllow } from "../../../utils/assessment";
import { createTransactionalUseCase } from "../../core/UseCase";
import { CreateNewEvent } from "../../core/events/ports/EventBus";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import {
  AssessmentEntity,
  createAssessmentEntity,
} from "../entities/AssessmentEntity";

type WithCreateNewEvent = { createNewEvent: CreateNewEvent };

export type CreateAssessment = ReturnType<typeof makeCreateAssessment>;
export const makeCreateAssessment = createTransactionalUseCase<
  AssessmentDto,
  void,
  ConventionJwtPayload | undefined,
  WithCreateNewEvent
>(
  { name: "CreateAssessment", inputSchema: assessmentSchema },
  async ({
    inputParams: dto,
    uow,
    deps,
    currentUser: conventionJwtPayload,
  }) => {
    if (!conventionJwtPayload)
      throw new ForbiddenError("No magic link provided");
    throwForbiddenIfNotAllow(dto.conventionId, conventionJwtPayload);

    const assessmentEntity = await validateConventionAndCreateAssessmentEntity(
      uow,
      dto,
    );

    const event = deps.createNewEvent({
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
  },
);

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
