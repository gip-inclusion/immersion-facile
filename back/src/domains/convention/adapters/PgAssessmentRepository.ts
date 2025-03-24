import { sql } from "kysely";
import {
  type AssessmentStatus,
  type ConventionId,
  type DateString,
  errors,
} from "shared";
import {
  type KyselyDb,
  jsonBuildObject,
} from "../../../config/pg/kysely/kyselyUtils";
import { assessmentEntitySchema } from "../../../utils/assessment";
import type { AssessmentEntity } from "../entities/AssessmentEntity";
import type { AssessmentRepository } from "../ports/AssessmentRepository";

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
      numberOfHoursActuallyMade: eb.ref("number_of_hours_actually_made"),
    }).as("assessment"),
  ]);
};

const parseAssessmentEntitySchema = (assessment: any) =>
  assessmentEntitySchema.parse({
    _entityName: "Assessment",
    conventionId: assessment.conventionId,
    status: assessment.status,
    establishmentFeedback: assessment.establishmentFeedback,
    establishmentAdvices: assessment.establishmentAdvices,
    endedWithAJob: assessment.endedWithAJob,
    numberOfHoursActuallyMade: assessment.numberOfHoursActuallyMade,
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

    return parseAssessmentEntitySchema(assessment);
  }

  public async getByConventionIds(
    conventionIds: ConventionId[],
  ): Promise<AssessmentEntity[]> {
    if (conventionIds.length === 0) return [];

    const result = await createAssessmentQueryBuilder(this.transaction)
      .where("convention_id", "in", conventionIds)
      .execute();

    return result.map(({ assessment }) =>
      parseAssessmentEntitySchema(assessment),
    );
  }

  public async save(assessmentEntity: AssessmentEntity): Promise<void> {
    const getNonLegacyFields = (assessmentEntity: AssessmentEntity) => {
      if (!("establishmentAdvices" in assessmentEntity)) return {};

      return {
        ended_with_a_job: assessmentEntity.endedWithAJob,
        type_of_contract: assessmentEntity.endedWithAJob
          ? assessmentEntity.typeOfContract
          : null,
        contract_start_date: assessmentEntity.endedWithAJob
          ? assessmentEntity.contractStartDate
          : null,
        establishment_advices: assessmentEntity.establishmentAdvices,
        last_day_of_presence:
          assessmentEntity.status === "PARTIALLY_COMPLETED"
            ? assessmentEntity.lastDayOfPresence
            : null,
        number_of_missed_hours:
          assessmentEntity.status === "PARTIALLY_COMPLETED"
            ? assessmentEntity.numberOfMissedHours
            : null,
      };
    };

    await this.transaction
      .insertInto("immersion_assessments")
      .values({
        convention_id: assessmentEntity.conventionId,
        status: assessmentEntity.status,
        establishment_feedback: assessmentEntity.establishmentFeedback,
        ...getNonLegacyFields(assessmentEntity),
        number_of_hours_actually_made:
          assessmentEntity.numberOfHoursActuallyMade,
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
