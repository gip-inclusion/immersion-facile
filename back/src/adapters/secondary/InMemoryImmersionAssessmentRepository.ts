import { ImmersionAssessmentEntity } from "../../domain/immersionAssessment/entities/ImmersionAssessmentEntity";
import { ImmersionAssessmentRepository } from "../../domain/immersionAssessment/ports/ImmersionAssessmentRepository";

export class InMemoryImmersionAssessmentRepository
  implements ImmersionAssessmentRepository
{
  private _assessments: ImmersionAssessmentEntity[] = [];

  public async save(assessment: ImmersionAssessmentEntity): Promise<void> {
    this._assessments.push(assessment);
  }

  // test purpose
  get assessments(): ImmersionAssessmentEntity[] {
    return this._assessments;
  }

  setAssessments(assessments: ImmersionAssessmentEntity[]) {
    this._assessments = assessments;
  }
}
