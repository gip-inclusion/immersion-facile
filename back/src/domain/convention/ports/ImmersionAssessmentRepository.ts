import { ConventionId } from "shared/src/convention/convention.dto";
import { ImmersionAssessmentEntity } from "../entities/ImmersionAssessmentEntity";

export interface ImmersionAssessmentRepository {
  save: (assessment: ImmersionAssessmentEntity) => Promise<void>;
  getByConventionId(
    conventionId: ConventionId,
  ): Promise<ImmersionAssessmentEntity | undefined>;
}
