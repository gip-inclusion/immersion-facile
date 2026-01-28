import type { PhoneNumber } from "shared";
import type { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";

export const getOrCreatePhoneId = async (
  transaction: KyselyDb,
  phoneNumber: PhoneNumber,
): Promise<number> =>
  transaction
    .selectFrom("phone_numbers")
    .select("id")
    .where("phone_number", "=", phoneNumber)
    .executeTakeFirst()
    .then(async (result) => {
      if (!result) {
        return await createPhoneId(transaction, phoneNumber);
      }
      return result.id as number;
    });

const createPhoneId = async (
  transaction: KyselyDb,
  phoneNumber: PhoneNumber,
): Promise<number> =>
  transaction
    .insertInto("phone_numbers")
    .values({
      phone_number: phoneNumber,
      verified_at: null,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
    .then((result) => result.id as number);
