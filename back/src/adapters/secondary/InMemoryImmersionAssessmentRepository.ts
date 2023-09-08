import { ConventionId } from "shared";
import { ImmersionAssessmentEntity } from "../../domain/convention/entities/ImmersionAssessmentEntity";
import { ImmersionAssessmentRepository } from "../../domain/convention/ports/ImmersionAssessmentRepository";

export class InMemoryImmersionAssessmentRepository
  implements ImmersionAssessmentRepository
{
  #assessments: ImmersionAssessmentEntity[] = [];

  // test purpose
  public get assessments(): ImmersionAssessmentEntity[] {
    return this.#assessments;
  }

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<ImmersionAssessmentEntity | undefined> {
    return this.#assessments.find(
      (assessment) => assessment.conventionId === conventionId,
    );
  }

  public async save(assessment: ImmersionAssessmentEntity): Promise<void> {
    this.#assessments.push(assessment);
  }

  public setAssessments(assessments: ImmersionAssessmentEntity[]) {
    this.#assessments = assessments;
  }
}
