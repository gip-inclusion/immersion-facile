import { PoolClient } from "pg";
import format from "pg-format";
import { SiretDto } from "shared";
import {
  DeletedEstablishementDto,
  DeletedEstablishmentRepository,
} from "../../../domain/immersionOffer/ports/DeletedEstablishmentRepository";

export class PgDeletedEstablishmentRepository
  implements DeletedEstablishmentRepository
{
  #client: PoolClient;

  constructor(client: PoolClient) {
    this.#client = client;
  }

  public async isSiretsDeleted(siretsToCheck: SiretDto[]): Promise<SiretDto[]> {
    const query = `
      SELECT siret
      FROM establishments_deleted
      WHERE siret = ANY($1)
    `;
    return (
      await this.#client.query<{ siret: SiretDto }>(query, [siretsToCheck])
    ).rows.map((row) => row.siret);
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

    await this.#client.query(query);
  }
}
