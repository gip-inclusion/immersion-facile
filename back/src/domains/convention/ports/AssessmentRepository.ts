import type { ConventionId } from "shared";
import type { AssessmentEntity } from "../entities/AssessmentEntity";

export interface AssessmentRepository {
  save: (assessment: AssessmentEntity) => Promise<void>;
  getByConventionId(
    conventionId: ConventionId,
  ): Promise<AssessmentEntity | undefined>;
  getByConventionIds(
    conventionIds: ConventionId[],
  ): Promise<AssessmentEntity[]>;
  update: (updatedAssessment: AssessmentEntity) => Promise<void>;
  delete: (conventionId: ConventionId) => Promise<void>;
}
