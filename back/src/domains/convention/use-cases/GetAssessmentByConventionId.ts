import {
  AssessmentDto,
  ConventionJwtPayload,
  WithConventionId,
  errors,
  withConventionIdSchema,
} from "shared";
import { throwForbiddenIfNotAllow } from "../../../utils/assessment";
import { createTransactionalUseCase } from "../../core/UseCase";
import { AssessmentEntity } from "../entities/AssessmentEntity";

export type GetAssessmentByConventionId = ReturnType<
  typeof makeGetAssessmentByConventionId
>;
export const makeGetAssessmentByConventionId = createTransactionalUseCase<
  WithConventionId,
  AssessmentDto,
  ConventionJwtPayload | undefined
>(
  {
    name: "GetAssessment",
    inputSchema: withConventionIdSchema,
  },
  async ({ uow, currentUser, inputParams }) => {
    if (!currentUser) throw errors.user.noJwtProvided();
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

const toAssessmentDto = ({
  _entityName,
  ...assessmentEntity
}: AssessmentEntity): AssessmentDto => assessmentEntity;
