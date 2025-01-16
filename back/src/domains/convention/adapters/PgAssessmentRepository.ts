import { sql } from "kysely";
import {
  AssessmentStatus,
  ConventionId,
  DateString,
  assessmentSchema,
  errors,
} from "shared";
import {
  KyselyDb,
  jsonBuildObject,
} from "../../../config/pg/kysely/kyselyUtils";
import { AssessmentEntity } from "../entities/AssessmentEntity";
import { AssessmentRepository } from "../ports/AssessmentRepository";

const createAssessmentQueryBuilder = (transaction: KyselyDb) => {
  return transaction.selectFrom("immersion_assessments").select((eb) => [
    jsonBuildObject({
      conventionId: eb.ref("convention_id"),
      status: eb.ref("status").$castTo<AssessmentStatus[]>(),
      establishmentFeedback: eb.ref("establishment_feedback"),
      establishmentAdvices: eb.ref("establishment_advices"),
      endedWithAJob: eb.ref("ended_with_a_job"),
      contractStartDate: sql<DateString>`date_to_iso(contract_start_date)`,
      typeOfContract: eb.ref("type_of_contract"),
      lastDayOfPresence: sql<DateString>`date_to_iso(last_day_of_presence)`,
      numberOfMissedHours: eb.ref("number_of_missed_hours"),
    }).as("assessment"),
  ]);
};

const parseAssessmentSchema = (assessment: any) => {
  return assessmentSchema.parse({
    conventionId: assessment.conventionId,
    status: assessment.status,
    establishmentFeedback: assessment.establishmentFeedback,
    establishmentAdvices: assessment.establishmentAdvices,
    endedWithAJob: assessment.endedWithAJob,
    ...(assessment.contractStartDate
      ? { contractStartDate: assessment.contractStartDate }
      : {}),
    ...(assessment.typeOfContract
      ? { typeOfContract: assessment.typeOfContract }
      : {}),
    ...(assessment.lastDayOfPresence
      ? { lastDayOfPresence: assessment.lastDayOfPresence }
      : {}),
    ...(assessment.numberOfMissedHours !== null
      ? { numberOfMissedHours: assessment.numberOfMissedHours }
      : {}),
  });
};

export class PgAssessmentRepository implements AssessmentRepository {
  constructor(private transaction: KyselyDb) {}

  public async getByConventionId(
    conventionId: ConventionId,
  ): Promise<AssessmentEntity | undefined> {
    const result = await createAssessmentQueryBuilder(this.transaction)
      .where("convention_id", "=", conventionId)
      .executeTakeFirst();

    const assessment = result?.assessment;
    if (!assessment) return;

    const dto = parseAssessmentSchema(assessment);

    return {
      _entityName: "Assessment",
      ...dto,
    };
  }

  public async getByConventionIds(
    conventionIds: ConventionId[],
  ): Promise<AssessmentEntity[]> {
    if (conventionIds.length === 0) return [];

    const result = await createAssessmentQueryBuilder(this.transaction)
      .where("convention_id", "in", conventionIds)
      .execute();

    return result.map(({ assessment }) => {
      return {
        _entityName: "Assessment",
        ...parseAssessmentSchema(assessment),
      };
    });
  }

  public async save(assessmentEntity: AssessmentEntity): Promise<void> {
    await this.transaction
      .insertInto("immersion_assessments")
      .values({
        convention_id: assessmentEntity.conventionId,
        status: assessmentEntity.status,
        last_day_of_presence:
          assessmentEntity.status === "PARTIALLY_COMPLETED"
            ? assessmentEntity.lastDayOfPresence
            : null,
        number_of_missed_hours:
          assessmentEntity.status === "PARTIALLY_COMPLETED"
            ? assessmentEntity.numberOfMissedHours
            : null,
        ended_with_a_job: assessmentEntity.endedWithAJob,
        type_of_contract: assessmentEntity.endedWithAJob
          ? assessmentEntity.typeOfContract
          : null,
        contract_start_date: assessmentEntity.endedWithAJob
          ? assessmentEntity.contractStartDate
          : null,
        establishment_feedback: assessmentEntity.establishmentFeedback,
        establishment_advices: assessmentEntity.establishmentAdvices,
      })
      .execute()
      .catch((error) => {
        if (error?.message.includes(noConventionMatchingErrorMessage))
          throw errors.convention.notFound({
            conventionId: assessmentEntity.conventionId,
          });

        throw error;
      });
  }
}

const noConventionMatchingErrorMessage =
  '"immersion_assessments" violates foreign key constraint "immersion_assessments_convention_id_fkey"';
