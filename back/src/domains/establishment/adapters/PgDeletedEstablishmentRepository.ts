import { SiretDto } from "shared";
import { KyselyDb } from "../../../config/pg/kysely/kyselyUtils";
import {
  DeletedEstablishementDto,
  DeletedEstablishmentRepository,
} from "../ports/DeletedEstablishmentRepository";

export class PgDeletedEstablishmentRepository
  implements DeletedEstablishmentRepository
{
  #transaction: KyselyDb;

  constructor(transaction: KyselyDb) {
    this.#transaction = transaction;
  }

  public async areSiretsDeleted(
    siretsToCheck: SiretDto[],
  ): Promise<Record<SiretDto, boolean>> {
    if (siretsToCheck.length === 0) return {};

    const result = await this.#transaction
      .selectFrom("establishments_deleted")
      .select("siret")
      .distinct()
      .where("siret", "in", siretsToCheck)
      .execute();

    return siretsToCheck.reduce<Record<SiretDto, boolean>>(
      (acc, siretToCheck) => ({
        ...acc,
        [siretToCheck]: result.some((row) => row.siret === siretToCheck),
      }),
      {},
    );
  }

  public async save(
    deleteEstablishment: DeletedEstablishementDto,
  ): Promise<void> {
    await this.#transaction
      .insertInto("establishments_deleted")
      .values({
        siret: deleteEstablishment.siret,
        created_at: deleteEstablishment.createdAt,
        deleted_at: deleteEstablishment.deletedAt,
      })
      .execute();
  }
}
