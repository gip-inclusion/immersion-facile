import { ConventionId } from "shared";
import { ImmersionAssessmentEntity } from "../entities/ImmersionAssessmentEntity";

export interface ImmersionAssessmentRepository {
  save: (assessment: ImmersionAssessmentEntity) => Promise<void>;
  getByConventionId(
    conventionId: ConventionId,
  ): Promise<ImmersionAssessmentEntity | undefined>;
}
