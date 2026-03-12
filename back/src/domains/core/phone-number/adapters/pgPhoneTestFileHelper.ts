import type { PhoneNumber } from "shared";
import type { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";

export const insertPhoneNumber = async (
  kyselyDb: KyselyDb,
  phoneToInsert: {
    phoneNumber: PhoneNumber;
    verifiedAt?: Date | null;
  },
): Promise<number> => {
  const result = await kyselyDb
    .insertInto("phone_numbers")
    .values({
      phone_number: phoneToInsert.phoneNumber,
      verified_at: phoneToInsert.verifiedAt,
    })
    .returning("phone_numbers.id")
    .executeTakeFirstOrThrow();
  return result.id;
};
