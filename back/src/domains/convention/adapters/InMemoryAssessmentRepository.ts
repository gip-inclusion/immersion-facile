import { type ConventionId, errors } from "shared";
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

  public async update(updatedAssessment: AssessmentEntity): Promise<void> {
    const assessmentToUpdate = this.#assessments.find(
      (a) => a.conventionId === updatedAssessment.conventionId,
    );
    if (!assessmentToUpdate) {
      throw errors.assessment.notFound(updatedAssessment.conventionId);
    }
    const index = this.#assessments.indexOf(assessmentToUpdate);

    this.#assessments[index] = updatedAssessment;
  }

  public async delete(conventionId: ConventionId): Promise<void> {
    this.#assessments = this.#assessments.filter(
      (assessment) => assessment.conventionId !== conventionId,
    );
  }

  public setAssessments(assessments: AssessmentEntity[]) {
    this.#assessments = assessments;
  }
}
