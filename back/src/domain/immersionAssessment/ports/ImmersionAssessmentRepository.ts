import { ImmersionApplicationId } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { ImmersionAssessmentEntity } from "../entities/ImmersionAssessmentEntity";

export interface ImmersionAssessmentRepository {
  save: (assessment: ImmersionAssessmentEntity) => Promise<void>;
  getByConventionId(
    conventionId: ImmersionApplicationId,
  ): Promise<ImmersionAssessmentEntity | undefined>;
}
