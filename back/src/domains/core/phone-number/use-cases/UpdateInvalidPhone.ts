import { sql } from "kysely";
import { type PhoneNumber, phoneNumberSchema } from "shared";
import z from "zod";
import type { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../useCaseBuilder";
import {
  type PhoneInDB,
  phoneInDBSchema,
} from "./VerifyAndRequestInvalidPhonesUpdate";

export type PhoneToUpdate = {
  currentPhone: PhoneInDB;
  newPhoneNumber: PhoneNumber;
};

const phoneToUpdateSchema = z.object({
  currentPhone: phoneInDBSchema,
  newPhoneNumber: phoneNumberSchema,
});

export type UpdateInvalidPhone = ReturnType<typeof makeUpdateInvalidPhone>;

export const makeUpdateInvalidPhone = useCaseBuilder("UpdateInvalidPhone")
  .withInput<{ phoneToUpdate: PhoneToUpdate }>(
    z.object({ phoneToUpdate: phoneToUpdateSchema }),
  )
  .withDeps<{ timeGateway: TimeGateway; kyselyDb: KyselyDb | null }>()
  .build(
    async ({
      inputParams: { phoneToUpdate },
      deps: { timeGateway, kyselyDb },
    }) => {
      if (!kyselyDb)
        throw new Error(
          "KyselyDb is null. In memory is not available for this use case",
        );

      if (
        phoneToUpdate.currentPhone.phoneNumber === phoneToUpdate.newPhoneNumber
      )
        return;

      const conflictingPhoneNumberId = await getConflictingPhoneNumberId(
        kyselyDb,
        phoneToUpdate,
      );

      conflictingPhoneNumberId
        ? await fixConflictingPhoneUpdate(
            kyselyDb,
            phoneToUpdate,
            conflictingPhoneNumberId,
          )
        : await fixNotConflictingPhone(kyselyDb, timeGateway, phoneToUpdate);
    },
  );

const getConflictingPhoneNumberId = async (
  kyselyDb: KyselyDb,
  phoneToUpdate: PhoneToUpdate,
): Promise<number | null> => {
  const existingPhone = await kyselyDb
    .selectFrom("phone_numbers")
    .select("id")
    .where("phone_number", "=", phoneToUpdate.newPhoneNumber)
    .executeTakeFirst();

  return existingPhone ? existingPhone.id : null;
};

const fixNotConflictingPhone = async (
  kyselyDb: KyselyDb,
  timeGateway: TimeGateway,
  phoneToUpdate: PhoneToUpdate,
): Promise<{ fixedPhoneId: number } | null> => {
  const result = await kyselyDb
    .updateTable("phone_numbers")
    .set({
      phone_number: phoneToUpdate.newPhoneNumber,
      verified_at: timeGateway.now(),
    })
    .where("id", "=", phoneToUpdate.currentPhone.id)
    .returning("id")
    .executeTakeFirst();

  return result ? { fixedPhoneId: result.id } : null;
};

const fixConflictingPhoneUpdate = async (
  kyselyDb: KyselyDb,
  phoneToUpdate: PhoneToUpdate,
  conflictingPhoneNumberId: number,
): Promise<void> => {
  const tables = await getTablesReferencingPhoneNumbers(kyselyDb);

  for (const { tableName, columnName } of tables) {
    await sql`
      UPDATE ${sql.id(tableName)}
      SET ${sql.id(columnName)} = ${sql.lit(conflictingPhoneNumberId)}
      WHERE ${sql.id(columnName)} = ${sql.lit(phoneToUpdate.currentPhone.id)}
    `.execute(kyselyDb);
  }
};

const getTablesReferencingPhoneNumbers = async (
  kyselyDb: KyselyDb,
): Promise<{ tableName: string; columnName: string }[]> => {
  const result = await sql<{ tableName: string; columnName: string }>`
    SELECT
      kcu.table_name as "tableName",
      kcu.column_name as "columnName"
    FROM information_schema.key_column_usage kcu
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = kcu.constraint_name
    JOIN information_schema.key_column_usage ccu
      ON ccu.constraint_name = rc.unique_constraint_name
    WHERE ccu.table_name = 'phone_numbers'
      AND ccu.column_name = 'id'
  `.execute(kyselyDb);

  return result.rows;
};
