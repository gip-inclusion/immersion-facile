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
  delete: (conventionId: ConventionId) => Promise<void>;
}
