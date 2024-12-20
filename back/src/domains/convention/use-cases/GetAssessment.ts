import {
  AssessmentDto,
  ConventionJwtPayload,
  ForbiddenError,
  WithConventionId,
  errors,
  withConventionIdSchema,
} from "shared";
import { throwForbiddenIfNotAllow } from "../../../utils/assessment";
import { createTransactionalUseCase } from "../../core/UseCase";
import { AssessmentEntity } from "../entities/AssessmentEntity";

export type GetAssessment = ReturnType<typeof makeGetAssessment>;
export const makeGetAssessment = createTransactionalUseCase<
  WithConventionId,
  AssessmentDto,
  ConventionJwtPayload | undefined
>(
  {
    name: "GetAssessment",
    inputSchema: withConventionIdSchema,
  },
  async ({ uow, currentUser, inputParams }) => {
    if (!currentUser) throw new ForbiddenError("No magic link provided");
    throwForbiddenIfNotAllow(inputParams.conventionId, currentUser);

    const assessment = await uow.assessmentRepository.getByConventionId(
      inputParams.conventionId,
    );

    if (!assessment) {
      throw errors.assessment.notFound(inputParams.conventionId);
    }

    return toAssessmentDto(assessment);
  },
);

const toAssessmentDto = (assessmentEntity: AssessmentEntity): AssessmentDto => {
  return {
    conventionId: assessmentEntity.conventionId,
    status: assessmentEntity.status,
    ...(assessmentEntity.status === "PARTIALLY_COMPLETED"
      ? {
          lastDayOfPresence: assessmentEntity.lastDayOfPresence,
          numberOfMissedHours: assessmentEntity.numberOfMissedHours,
        }
      : {}),
    endedWithAJob: assessmentEntity.endedWithAJob,
    ...(assessmentEntity.endedWithAJob
      ? {
          typeOfContract: assessmentEntity.typeOfContract,
          contractStartDate: assessmentEntity.contractStartDate,
        }
      : {}),
    establishmentFeedback: assessmentEntity.establishmentFeedback,
    establishmentAdvices: assessmentEntity.establishmentAdvices,
  } as AssessmentDto;
};
