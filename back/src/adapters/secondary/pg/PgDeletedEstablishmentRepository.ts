import { Kysely } from "kysely";
import format from "pg-format";
import { SiretDto } from "shared";
import {
  DeletedEstablishementDto,
  DeletedEstablishmentRepository,
} from "../../../domain/immersionOffer/ports/DeletedEstablishmentRepository";
import { executeKyselyRawSqlQuery, ImmersionDatabase } from "./sql/database";

export class PgDeletedEstablishmentRepository
  implements DeletedEstablishmentRepository
{
  constructor(private transaction: Kysely<ImmersionDatabase>) {}

  public async areSiretsDeleted(
    siretsToCheck: SiretDto[],
  ): Promise<Record<SiretDto, boolean>> {
    const query = `
      SELECT DISTINCT siret
      FROM establishments_deleted
      WHERE siret = ANY($1)
    `;
    const result = await executeKyselyRawSqlQuery<{ siret: SiretDto }>(
      this.transaction,
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

    await executeKyselyRawSqlQuery(this.transaction, query);
  }
}
