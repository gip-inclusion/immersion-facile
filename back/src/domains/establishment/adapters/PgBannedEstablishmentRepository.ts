import type { SiretDto } from "shared";
import type { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import type { BannedEstablishmentRepository } from "../ports/BannedEstablishmentRepository";
import type { BannedEstablishment } from "../use-cases/BanEstablishment";

export class PgBannedEstablishmentRepository
  implements BannedEstablishmentRepository
{
  constructor(private transaction: KyselyDb) {}

  public async getBannedEstablishmentBySiret(
    siret: SiretDto,
  ): Promise<BannedEstablishment | undefined> {
    return await this.transaction
      .selectFrom("banned_establishments")
      .select([
        "siret",
        "bannishment_justification as bannishmentJustification",
      ])
      .where("siret", "=", siret)
      .executeTakeFirst();
  }
  public async banEstablishment({
    siret,
    bannishmentJustification,
  }: {
    siret: SiretDto;
    bannishmentJustification: string;
  }): Promise<void> {
    await this.transaction
      .insertInto("banned_establishments")
      .values({
        siret,
        bannishment_justification: bannishmentJustification,
      })
      .execute();
  }
}
