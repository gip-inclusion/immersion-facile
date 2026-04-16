import type { BanEstablishmentPayload, SiretDto } from "shared";
import type { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import type {
  BannedEstablishmentOutput,
  BannedEstablishmentRepository,
} from "../ports/BannedEstablishmentRepository";

export class PgBannedEstablishmentRepository
  implements BannedEstablishmentRepository
{
  constructor(private transaction: KyselyDb) {}

  public async getBannedEstablishmentBySiret(
    siret: SiretDto,
  ): Promise<BannedEstablishmentOutput | undefined> {
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
  }: BanEstablishmentPayload): Promise<void> {
    await this.transaction
      .insertInto("banned_establishments")
      .values({
        siret,
        bannishment_justification: bannishmentJustification,
      })
      .execute();
  }
}
