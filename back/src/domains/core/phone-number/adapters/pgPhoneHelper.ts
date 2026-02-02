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
  const existingPhones: Record<PhoneNumber, PhoneId> = await transaction
    .selectFrom("phone_numbers")
    .select(["id", "phone_number"])
    .where("phone_number", "in", uniquePhoneNumbers)
    .execute()
    .then((result) =>
      Object.fromEntries(result.map((p) => [p.phone_number, p.id])),
    );

  const phoneIdsToCreate = uniquePhoneNumbers.filter(
    (num) => !existingPhones[num],
  );
  if (phoneIdsToCreate.length === 0) return existingPhones;

  const createdPhones: Record<PhoneNumber, PhoneId> = {};
  const newPhones = await createPhoneIds(transaction, phoneIdsToCreate);
  newPhones.forEach((p) => {
    createdPhones[p.phone_number] = p.id;
  });

  return { ...existingPhones, ...createdPhones };
};

const createPhoneIds = async (
  transaction: KyselyDb,
  phoneNumbers: PhoneNumber[],
): Promise<Array<{ id: PhoneId; phone_number: PhoneNumber }>> =>
  transaction
    .insertInto("phone_numbers")
    .values(
      phoneNumbers.map((phone_number) => ({ phone_number, verified_at: null })),
    )
    .returning(["id", "phone_number"])
    .execute();
