import type { BanEstablishmentPayload, SiretDto } from "shared";
import type { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import type {
  BannedEstablishment,
  BannedEstablishmentRepository,
} from "../ports/BannedEstablishmentRepository";

export class PgBannedEstablishmentRepository
  implements BannedEstablishmentRepository
{
  constructor(private transaction: KyselyDb) {}

  public async getBannedEstablishments(): Promise<BannedEstablishment[]> {
    return this.transaction
      .selectFrom("banned_establishments")
      .select([
        "siret",
        "bannishment_justification as establishmentBannishmentJustification",
      ])
      .execute();
  }

  public async getBannedEstablishmentBySiret(
    siret: SiretDto,
  ): Promise<BannedEstablishment | undefined> {
    return await this.transaction
      .selectFrom("banned_establishments")
      .select([
        "siret",
        "bannishment_justification as establishmentBannishmentJustification",
      ])
      .where("siret", "=", siret)
      .executeTakeFirst();
  }
  public async banEstablishment({
    siret,
    establishmentBannishmentJustification,
  }: BanEstablishmentPayload): Promise<void> {
    await this.transaction
      .insertInto("banned_establishments")
      .values({
        siret,
        bannishment_justification: establishmentBannishmentJustification,
      })
      .execute();
  }
}
