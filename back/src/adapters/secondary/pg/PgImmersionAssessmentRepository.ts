import { PoolClient } from "pg";

import {
  AssessmentStatus,
  ConventionId,
  immersionAssessmentSchema,
} from "shared";

import { ImmersionAssessmentEntity } from "../../../domain/convention/entities/ImmersionAssessmentEntity";
import { ImmersionAssessmentRepository } from "../../../domain/convention/ports/ImmersionAssessmentRepository";

interface PgImmersionAssessment {
  convention_id: string;
  status: AssessmentStatus;
  establishment_feedback: string;
}

export class PgImmersionAssessmentRepository
  implements ImmersionAssessmentRepository
{
  constructor(private client: PoolClient) {}

  public async save(assessment: ImmersionAssessmentEntity): Promise<void> {
    const { status, conventionId, establishmentFeedback } = assessment;

    await this.client
      .query(
        `INSERT INTO immersion_assessments(
        convention_id, status, establishment_feedback
      ) VALUES($1, $2, $3)`,
        [conventionId, status, establishmentFeedback],
      )
      .catch((error) => {
        if (error?.message.includes(noConventionMatchingErrorMessage))
          throw new Error(`No convention found for id ${conventionId}`);

        throw error;
      });
  }

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<ImmersionAssessmentEntity | undefined> {
    const result = await this.client.query<PgImmersionAssessment>(
      "SELECT * FROM immersion_assessments WHERE convention_id = $1",
      [conventionId],
    );
    const pgAssessment = result.rows[0];
    if (!pgAssessment) return;

    const dto = immersionAssessmentSchema.parse({
      conventionId: pgAssessment.convention_id,
      establishmentFeedback: pgAssessment.establishment_feedback,
      status: pgAssessment.status,
    });

    return {
      _entityName: "ImmersionAssessment",
      ...dto,
    };
  }
}

const noConventionMatchingErrorMessage =
  '"immersion_assessments" violates foreign key constraint "immersion_assessments_convention_id_fkey"';
