import { assessmentSchema, AssessmentStatus, ConventionId } from "shared";
import { AssessmentEntity } from "../../../../domain/convention/entities/AssessmentEntity";
import { AssessmentRepository } from "../../../../domain/convention/ports/AssessmentRepository";
import { executeKyselyRawSqlQuery, KyselyDb } from "../kysely/kyselyUtils";

interface PgAssessment {
  convention_id: string;
  status: AssessmentStatus;
  establishment_feedback: string;
}

export class PgAssessmentRepository implements AssessmentRepository {
  constructor(private transaction: KyselyDb) {}

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<AssessmentEntity | undefined> {
    const result = await executeKyselyRawSqlQuery<PgAssessment>(
      this.transaction,
      "SELECT * FROM immersion_assessments WHERE convention_id = $1",
      [conventionId],
    );
    const pgAssessment = result.rows[0];
    if (!pgAssessment) return;

    const dto = assessmentSchema.parse({
      conventionId: pgAssessment.convention_id,
      establishmentFeedback: pgAssessment.establishment_feedback,
      status: pgAssessment.status,
    });

    return {
      _entityName: "Assessment",
      ...dto,
    };
  }

  public async save(assessment: AssessmentEntity): Promise<void> {
    const { status, conventionId, establishmentFeedback } = assessment;

    await executeKyselyRawSqlQuery(
      this.transaction,
      `INSERT INTO immersion_assessments(
        convention_id, status, establishment_feedback
      ) VALUES($1, $2, $3)`,
      [conventionId, status, establishmentFeedback],
    ).catch((error) => {
      if (error?.message.includes(noConventionMatchingErrorMessage))
        throw new Error(`No convention found for id ${conventionId}`);

      throw error;
    });
  }
}

const noConventionMatchingErrorMessage =
  '"immersion_assessments" violates foreign key constraint "immersion_assessments_convention_id_fkey"';
