import type { Flavor, PhoneNumber } from "shared";
import type { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";

export type PhoneId = Flavor<number, "PhoneId">;

export const getOrCreatePhoneIds = async (
  transaction: KyselyDb,
  phoneNumbers: PhoneNumber[],
): Promise<Record<PhoneNumber, PhoneId>> => {
  if (phoneNumbers.length === 0) {
    return {};
  }

  const uniquePhoneNumbers = [...new Set(phoneNumbers)];

  const phones = await transaction
    .insertInto("phone_numbers")
    .values(
      uniquePhoneNumbers.map((phone_number) => ({
        phone_number,
        verified_at: null,
      })),
    )
    .onConflict((oc) =>
      oc.column("phone_number").doUpdateSet({
        phone_number: (eb) => eb.ref("excluded.phone_number"),
      }),
    )
    .returning(["id", "phone_number"])
    .execute();

  return Object.fromEntries(phones.map((p) => [p.phone_number, p.id]));
};

export const phoneNumberExist = async (
  transaction: KyselyDb,
  phoneNumber: PhoneNumber,
): Promise<boolean> => {
  const result = await transaction
    .selectFrom("phone_numbers")
    .select("id")
    .where("phone_number", "=", phoneNumber)
    .executeTakeFirst();

  return result !== undefined;
};

export const phoneNumbersExist = async (
  transaction: KyselyDb,
  phoneNumbers: PhoneNumber[],
): Promise<boolean> => {
  if (phoneNumbers.length === 0) {
    return false;
  }

  const uniquePhoneNumbers = [...new Set(phoneNumbers)];

  const results = await transaction
    .selectFrom("phone_numbers")
    .select("phone_number")
    .where("phone_number", "in", uniquePhoneNumbers)
    .execute();

  return results.length === uniquePhoneNumbers.length;
};
