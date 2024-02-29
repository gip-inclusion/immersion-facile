import format from "pg-format";
import { SiretDto } from "shared";
import {
  DeletedEstablishementDto,
  DeletedEstablishmentRepository,
} from "../../../../domains/establishment/ports/DeletedEstablishmentRepository";
import { KyselyDb, executeKyselyRawSqlQuery } from "../kysely/kyselyUtils";

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
    const query = `
      SELECT DISTINCT siret
      FROM establishments_deleted
      WHERE siret = ANY($1)
    `;
    const result = await executeKyselyRawSqlQuery<{ siret: SiretDto }>(
      this.#transaction,
      query,
      [siretsToCheck],
    );
    return siretsToCheck.reduce<Record<SiretDto, boolean>>(
      (acc, siretToCheck) => ({
        ...acc,
        [siretToCheck]: result.rows.some((row) => row.siret === siretToCheck),
      }),
      {},
    );
  }

  public async save(
    deleteEstablishment: DeletedEstablishementDto,
  ): Promise<void> {
    const query = format(
      `INSERT INTO establishments_deleted (
        siret, created_at, deleted_at
        ) VALUES %L`,
      [
        [
          deleteEstablishment.siret,
          deleteEstablishment.createdAt,
          deleteEstablishment.deletedAt,
        ],
      ],
    );

    await executeKyselyRawSqlQuery(this.#transaction, query);
  }
}
