import {
  type AssessmentDto,
  type ConventionDto,
  type ConventionRelatedJwtPayload,
  ForbiddenError,
  assessmentDtoSchema,
  errors,
} from "shared";
import { agencyWithRightToAgencyDto } from "../../../utils/agency";
import { throwForbiddenIfNotAllowedForAssessments } from "../../../utils/assessment";
import { createTransactionalUseCase } from "../../core/UseCase";
import type { TriggeredBy } from "../../core/events/events";
import type { CreateNewEvent } from "../../core/events/ports/EventBus";
import type { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import {
  type AssessmentEntity,
  createAssessmentEntity,
} from "../entities/AssessmentEntity";
import { retrieveConventionWithAgency } from "../entities/Convention";

type WithCreateNewEvent = { createNewEvent: CreateNewEvent };

export type CreateAssessment = ReturnType<typeof makeCreateAssessment>;
export const makeCreateAssessment = createTransactionalUseCase<
  AssessmentDto,
  void,
  ConventionRelatedJwtPayload | undefined,
  WithCreateNewEvent
>(
  { name: "CreateAssessment", inputSchema: assessmentDtoSchema },
  async ({
    inputParams: assessment,
    uow,
    deps,
    currentUser: conventionJwtPayload,
  }) => {
    if (!conventionJwtPayload)
      throw new ForbiddenError("No magic link provided");

    const { agency, convention } = await retrieveConventionWithAgency(
      uow,
      assessment.conventionId,
    );

    await throwForbiddenIfNotAllowedForAssessments({
      mode: "CreateAssessment",
      convention,
      agency: await agencyWithRightToAgencyDto(uow, agency),
      jwtPayload: conventionJwtPayload,
      uow,
    });

    const assessmentEntity = await createAssessmentEntityIfNotExist(
      uow,
      convention,
      assessment,
    );

    const triggeredBy: TriggeredBy =
      "role" in conventionJwtPayload
        ? {
            kind: "convention-magic-link",
            role: conventionJwtPayload.role,
          }
        : {
            kind: "inclusion-connected",
            userId: conventionJwtPayload.userId,
          };
    await Promise.all([
      uow.assessmentRepository.save(assessmentEntity),
      uow.outboxRepository.save(
        deps.createNewEvent({
          topic: "AssessmentCreated",
          payload: {
            convention,
            assessment: assessment,
            triggeredBy,
          },
        }),
      ),
    ]);
  },
);

const createAssessmentEntityIfNotExist = async (
  uow: UnitOfWork,
  convention: ConventionDto,
  assessment: AssessmentDto,
): Promise<AssessmentEntity> => {
  const existingAssessmentEntity =
    await uow.assessmentRepository.getByConventionId(convention.id);

  if (existingAssessmentEntity)
    throw errors.assessment.alreadyExist(convention.id);

  return createAssessmentEntity(assessment, convention);
};
