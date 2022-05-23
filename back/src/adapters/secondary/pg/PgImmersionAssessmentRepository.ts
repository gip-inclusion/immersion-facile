import { PoolClient } from "pg";
import { ImmersionAssessmentEntity } from "../../../domain/immersionAssessment/entities/ImmersionAssessmentEntity";
import { ImmersionAssessmentRepository } from "../../../domain/immersionAssessment/ports/ImmersionAssessmentRepository";

export class PgImmersionAssessmentRepository
  implements ImmersionAssessmentRepository
{
  constructor(private client: PoolClient) {}

  public async save(assessment: ImmersionAssessmentEntity): Promise<void> {
    const { id, status, conventionId, establishmentFeedback } = assessment;

    await this.client
      .query(
        `INSERT INTO immersion_assessments(
        id, status, convention_id, establishment_feedback
      ) VALUES($1, $2, $3, $4)`,
        [id, status, conventionId, establishmentFeedback],
      )
      .catch((error) => {
        if (error?.message.includes(noConventionMatchingErrorMessage))
          throw new Error(`No convention found for id ${conventionId}`);

        throw error;
      });
  }
}

const noConventionMatchingErrorMessage =
  '"immersion_assessments" violates foreign key constraint "immersion_assessments_convention_id_fkey"';
