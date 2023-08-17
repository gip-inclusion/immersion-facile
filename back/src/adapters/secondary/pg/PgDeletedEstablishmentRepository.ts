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

  public async areSiretsDeleted(
    siretsToCheck: SiretDto[],
  ): Promise<Record<SiretDto, boolean>> {
    const query = `
      SELECT DISTINCT siret
      FROM establishments_deleted
      WHERE siret = ANY($1)
    `;
    const result = await this.#client.query<{ siret: SiretDto }>(query, [
      siretsToCheck,
    ]);
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

    await this.#client.query(query);
  }
}
