import { ConventionId } from "shared";
import { ImmersionAssessmentEntity } from "../../domain/convention/entities/ImmersionAssessmentEntity";
import { ImmersionAssessmentRepository } from "../../domain/convention/ports/ImmersionAssessmentRepository";

export class InMemoryImmersionAssessmentRepository
  implements ImmersionAssessmentRepository
{
  private _assessments: ImmersionAssessmentEntity[] = [];

  // test purpose
  get assessments(): ImmersionAssessmentEntity[] {
    return this._assessments;
  }

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<ImmersionAssessmentEntity | undefined> {
    return this._assessments.find(
      (assessment) => assessment.conventionId === conventionId,
    );
  }

  public async save(assessment: ImmersionAssessmentEntity): Promise<void> {
    this._assessments.push(assessment);
  }

  setAssessments(assessments: ImmersionAssessmentEntity[]) {
    this._assessments = assessments;
  }
}
