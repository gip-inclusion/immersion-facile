import type { ConventionId } from "shared";
import type { AssessmentEntity } from "../entities/AssessmentEntity";
import type { AssessmentRepository } from "../ports/AssessmentRepository";

export class InMemoryAssessmentRepository implements AssessmentRepository {
  #assessments: AssessmentEntity[] = [];

  // test purpose
  public get assessments(): AssessmentEntity[] {
    return this.#assessments;
  }

  public set assessments(assessments: AssessmentEntity[]) {
    this.#assessments = assessments;
  }

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<AssessmentEntity | undefined> {
    return this.#assessments.find(
      (assessment) => assessment.conventionId === conventionId,
    );
  }

  public async getByConventionIds(
    conventionIds: ConventionId[],
  ): Promise<AssessmentEntity[]> {
    return this.#assessments.filter((assessment) =>
      conventionIds.includes(assessment.conventionId),
    );
  }

  public async save(assessment: AssessmentEntity): Promise<void> {
    this.#assessments.push(assessment);
  }

  public setAssessments(assessments: AssessmentEntity[]) {
    this.#assessments = assessments;
  }
}
