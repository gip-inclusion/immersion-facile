import { ConventionId, assessmentSchema } from "shared";
import { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import { AssessmentEntity } from "../entities/AssessmentEntity";
import { AssessmentRepository } from "../ports/AssessmentRepository";

export class PgAssessmentRepository implements AssessmentRepository {
  constructor(private transaction: KyselyDb) {}

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<AssessmentEntity | undefined> {
    const result = await this.transaction
      .selectFrom("immersion_assessments")
      .selectAll()
      .where("convention_id", "=", conventionId)
      .executeTakeFirst();

    if (!result) return;

    const dto = assessmentSchema.parse({
      conventionId: result.convention_id,
      establishmentFeedback: result.establishment_feedback,
      status: result.status,
    });

    return {
      _entityName: "Assessment",
      ...dto,
    };
  }

  public async save({
    status,
    conventionId,
    establishmentFeedback,
  }: AssessmentEntity): Promise<void> {
    await this.transaction
      .insertInto("immersion_assessments")
      .values({
        convention_id: conventionId,
        status,
        establishment_feedback: establishmentFeedback,
      })
      .execute()
      .catch((error) => {
        if (error?.message.includes(noConventionMatchingErrorMessage))
          throw new Error(`No convention found for id ${conventionId}`);

        throw error;
      });
  }
}

const noConventionMatchingErrorMessage =
  '"immersion_assessments" violates foreign key constraint "immersion_assessments_convention_id_fkey"';
