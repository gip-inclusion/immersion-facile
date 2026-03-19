import { sql } from "kysely";
import {
  type Phone,
  type PhoneVerificationStatus,
  pipeWithValue,
} from "shared";
import type { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import type { Database } from "../../../../config/pg/kysely/model/database";
import type {
  PhoneRepository,
  SafeUpdatePhoneParams,
  TablesWithPhoneReference,
} from "../ports/PhoneRepository";
import type { UpdatePhonePayload } from "../use-cases/UpdateInvalidPhone";
import type { PhoneId } from "./pgPhoneHelper";

export class PgPhoneRepository implements PhoneRepository {
  constructor(private transaction: KyselyDb) {}

  async getConflictingPhoneNumberId(params: {
    updatePhonePayload: UpdatePhonePayload;
  }): Promise<number | null> {
    const { updatePhonePayload } = params;
    const existingPhone = await this.transaction
      .selectFrom("phone_numbers")
      .select("id")
      .where("phone_number", "=", updatePhonePayload.newPhoneNumber)
      .executeTakeFirst();

    return existingPhone ? existingPhone.id : null;
  }

  async fixConflictingPhoneUpdate(params: {
    updatePhonePayload: UpdatePhonePayload;
    conflictingPhoneNumberId: number;
  }): Promise<void> {
    const { updatePhonePayload, conflictingPhoneNumberId } = params;

    const updateByTable: Record<TablesWithPhoneReference, () => Promise<void>> =
      {
        discussions: async () => {
          await this.transaction
            .updateTable("discussions")
            .set({ potential_beneficiary_phone_id: conflictingPhoneNumberId })
            .where(
              "potential_beneficiary_phone_id",
              "=",
              updatePhonePayload.currentPhone.id,
            )
            .execute();
        },

        agencies: async () => {
          await this.transaction
            .updateTable("agencies")
            .set({ phone_id: conflictingPhoneNumberId })
            .where("phone_id", "=", updatePhonePayload.currentPhone.id)
            .execute();
        },

        api_consumers: async () => {
          await this.transaction
            .updateTable("api_consumers")
            .set({ contact_phone_id: conflictingPhoneNumberId })
            .where("contact_phone_id", "=", updatePhonePayload.currentPhone.id)
            .execute();
        },

        establishments__users: async () => {
          await this.transaction
            .updateTable("establishments__users")
            .set({ phone_id: conflictingPhoneNumberId })
            .where("phone_id", "=", updatePhonePayload.currentPhone.id)
            .execute();
        },

        actors: async () => {
          await this.transaction
            .updateTable("actors")
            .set({ phone_id: conflictingPhoneNumberId })
            .where("phone_id", "=", updatePhonePayload.currentPhone.id)
            .execute();
        },
      };

    await Promise.all(Object.values(updateByTable).map((update) => update()));

    await this.transaction
      .deleteFrom("phone_numbers")
      .where("id", "=", updatePhonePayload.currentPhone.id)
      .execute();
  }

  async fixNotConflictingPhone(params: {
    updatePhonePayload: UpdatePhonePayload;
    verificationDate: Date;
  }): Promise<{ fixedPhoneId: number } | null> {
    const { updatePhonePayload, verificationDate } = params;
    const result = await this.transaction
      .updateTable("phone_numbers")
      .set({
        phone_number: updatePhonePayload.newPhoneNumber,
        verification_status: "VERIFICATION_COMPLETED",
        verified_at: verificationDate,
      })
      .where("id", "=", updatePhonePayload.currentPhone.id)
      .returning("id")
      .executeTakeFirst();

    return result ? { fixedPhoneId: result.id } : null;
  }

  async getPhoneNumbers(
    params: { verifiedBefore?: Date; limit?: number } = {
      limit: 100,
      verifiedBefore: new Date(Date.now()),
    },
  ): Promise<Phone[]> {
    const { verifiedBefore, limit } = params;

    const rows = await pipeWithValue(
      this.transaction
        .selectFrom("phone_numbers")
        .select(["id", "phone_number", "verification_status", "verified_at"]),
      (b) =>
        verifiedBefore
          ? b.where((eb) =>
              eb.or([
                eb("verified_at", "is", null),
                eb("verified_at", "<", verifiedBefore),
              ]),
            )
          : b,
      (b) => (limit ? b.limit(limit) : b),
    ).execute();

    return rows.map((row) => ({
      id: row.id,
      phoneNumber: row.phone_number,
      verificationStatus: row.verification_status,
      verifiedAt: row.verified_at ? new Date(row.verified_at) : null,
    }));
  }

  async markAsVerified(params: {
    phoneIds: PhoneId[];
    verifiedDate: Date;
  }): Promise<void> {
    const { phoneIds, verifiedDate } = params;

    if (phoneIds.length === 0) return;

    await this.transaction
      .updateTable("phone_numbers")
      .set({ verified_at: verifiedDate })
      .where("id", "in", phoneIds)
      .execute();
  }

  async updateVerificationStatus(params: {
    phoneIds: PhoneId[];
    verificationStatus: PhoneVerificationStatus;
  }): Promise<void> {
    const { phoneIds, verificationStatus } = params;

    if (phoneIds.length === 0) return;

    await this.transaction
      .updateTable("phone_numbers")
      .set({ verification_status: verificationStatus })
      .where("id", "in", phoneIds)
      .execute();
  }

  async safeUpdatePhone(
    phoneId: number,
    params: Partial<SafeUpdatePhoneParams>,
  ): Promise<void> {
    const { verifiedAt, verificationStatus } = params;

    await this.transaction
      .updateTable("phone_numbers")
      .set({
        ...(verifiedAt !== undefined && { verified_at: verifiedAt }),
        ...(verificationStatus !== undefined && {
          verification_status: verificationStatus,
        }),
      })
      .where("id", "=", phoneId)
      .execute();
  }

  async getTableNamesReferencingPhoneNumbers(): Promise<(keyof Database)[]> {
    const result = await sql<{ tableName: keyof Database }>`
    SELECT
      kcu.table_name as "tableName"
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = kcu.constraint_name
    JOIN information_schema.key_column_usage ccu
      ON ccu.constraint_name = rc.unique_constraint_name
    WHERE ccu.table_name = 'phone_numbers'
      AND ccu.column_name = 'id'
  `.execute(this.transaction);

    return result.rows.map((row) => row.tableName);
  }
}
