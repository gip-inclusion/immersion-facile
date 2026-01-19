import type { PhoneNumber, PhoneNumberId } from "shared";
import type { KyselyDb } from "../../../../config/pg/kysely/kyselyUtils";
import type { PhoneNumberRepository } from "../ports/PhoneNumberRepository";

export class PgPhoneNumberRepository implements PhoneNumberRepository {
  constructor(private transaction: KyselyDb) { }
  public async getIdByPhoneNumber(
    phone: PhoneNumber,
    now: Date,
  ): Promise<PhoneNumberId> {
    const result = await this.transaction
      .selectFrom("phone_numbers")
      .select("id")
      .where("phone_number", "=", phone)
      .executeTakeFirst();

    if (!result) {
      return this.#save(phone, now);
    }

    return result.id;
  }
  async #save(phone: PhoneNumber, now: Date): Promise<PhoneNumberId> {
    const result = await this.transaction
      .insertInto("phone_numbers")
      .values({
        phone_number: phone,
        verified_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow();
    return result.id;
  }
}