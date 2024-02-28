import { ConventionId } from "shared";
import { AssessmentEntity } from "../entities/AssessmentEntity";

export interface AssessmentRepository {
  save: (assessment: AssessmentEntity) => Promise<void>;
  getByConventionId(
    conventionId: ConventionId,
  ): Promise<AssessmentEntity | undefined>;
}
