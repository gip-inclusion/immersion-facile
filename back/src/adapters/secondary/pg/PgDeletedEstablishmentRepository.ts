import { PoolClient } from "pg";
import format from "pg-format";
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
