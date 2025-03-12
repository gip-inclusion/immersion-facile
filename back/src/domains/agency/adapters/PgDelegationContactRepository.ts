import type { Email } from "shared";
import type { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import type { DelegationContactRepository } from "../ports/DelegationContactRepository";

export class PgDelegationContactRepository
  implements DelegationContactRepository
{
  constructor(private transaction: KyselyDb) {}

  public async getEmailByProvince(
    province: string,
  ): Promise<Email | undefined> {
    const response = await this.transaction
      .selectFrom("delegation_contacts")
      .select("email")
      .where("province", "=", province)
      .executeTakeFirst();
    return response?.email;
  }
}
