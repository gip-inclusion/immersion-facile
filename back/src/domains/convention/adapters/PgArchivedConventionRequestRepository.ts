import type {
  ArchivedConventionRequestId,
  ArchivedConventionRequestReason,
  ArchivedConventionRequestReasonFields,
} from "shared";
import { archivedConventionRequestReasons, errors } from "shared";
import type { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import type {
  ArchivedConventionRequestEntity,
  ArchivedConventionRequestRepository,
} from "../ports/ArchivedConventionRequestRepository";

type ArchivedConventionRequestRow = {
  id: string;
  user_id: string;
  created_at: Date;
  convention_id: string | null;
  beneficiary_first_name: string | null;
  beneficiary_last_name: string | null;
  siret: string | null;
  immersion_date: string | null;
  immersion_appellation_code: number | null;
  reason: string;
  other_reason: string | null;
};

export class PgArchivedConventionRequestRepository
  implements ArchivedConventionRequestRepository
{
  constructor(private readonly transaction: KyselyDb) {}

  public async getAll(): Promise<ArchivedConventionRequestEntity[]> {
    const rows = await this.transaction
      .selectFrom("archived_convention_requests")
      .selectAll()
      .orderBy("archived_convention_requests.created_at", "desc")
      .execute();

    return rows.map(toArchivedConventionRequestEntity);
  }

  public async getById(
    id: ArchivedConventionRequestId,
  ): Promise<ArchivedConventionRequestEntity | undefined> {
    const row = await this.transaction
      .selectFrom("archived_convention_requests")
      .selectAll()
      .where("archived_convention_requests.id", "=", id)
      .executeTakeFirst();

    return row ? toArchivedConventionRequestEntity(row) : undefined;
  }

  public async save(
    archivedConventionRequest: ArchivedConventionRequestEntity,
  ): Promise<void> {
    const commonValues = {
      id: archivedConventionRequest.id,
      user_id: archivedConventionRequest.userId,
      created_at: new Date(archivedConventionRequest.createdAt),
      reason: archivedConventionRequest.reason,
      other_reason: archivedConventionRequest.otherReason,
    };

    if (
      archivedConventionRequest.conventionSearchMethod === "withConventionId"
    ) {
      await this.transaction
        .insertInto("archived_convention_requests")
        .values({
          ...commonValues,
          convention_id: archivedConventionRequest.conventionId,
        })
        .execute();
      return;
    }

    await this.transaction
      .insertInto("archived_convention_requests")
      .values({
        ...commonValues,
        beneficiary_first_name: archivedConventionRequest.beneficiaryFirstName,
        beneficiary_last_name: archivedConventionRequest.beneficiaryLastName,
        siret: archivedConventionRequest.siret,
        immersion_date: archivedConventionRequest.immersionDate,
        immersion_appellation_code: Number.parseInt(
          archivedConventionRequest.immersionAppellationCode,
          10,
        ),
      })
      .execute();
  }
}

const isArchivedConventionRequestReason = (
  reason: string,
): reason is ArchivedConventionRequestReason =>
  archivedConventionRequestReasons.some((value) => value === reason);

const toArchivedConventionRequestEntity = (
  row: ArchivedConventionRequestRow,
): ArchivedConventionRequestEntity => {
  if (!isArchivedConventionRequestReason(row.reason))
    throw errors.archivedConventionRequest.unknownReason({
      reason: row.reason,
    });

  const reasonFields: ArchivedConventionRequestReasonFields =
    row.reason === "other"
      ? {
          reason: "other",
          otherReason: row.other_reason ?? "",
        }
      : { reason: row.reason };

  const common = {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at.toISOString(),
    ...reasonFields,
  };

  if (row.convention_id)
    return {
      ...common,
      conventionSearchMethod: "withConventionId",
      conventionId: row.convention_id,
    };

  if (
    !row.beneficiary_first_name ||
    !row.beneficiary_last_name ||
    !row.siret ||
    !row.immersion_date ||
    !row.immersion_appellation_code
  )
    throw errors.archivedConventionRequest.incomplete({
      id: row.id,
    });

  return {
    ...common,
    conventionSearchMethod: "withConventionDetails",
    beneficiaryFirstName: row.beneficiary_first_name,
    beneficiaryLastName: row.beneficiary_last_name,
    siret: row.siret,
    immersionDate: row.immersion_date,
    immersionAppellationCode: row.immersion_appellation_code.toString(),
  };
};
