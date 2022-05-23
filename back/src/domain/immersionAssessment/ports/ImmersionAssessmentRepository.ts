import { ImmersionAssessmentEntity } from "../entities/ImmersionAssessmentEntity";

export interface ImmersionAssessmentRepository {
  save: (assessment: ImmersionAssessmentEntity) => Promise<void>;
}
