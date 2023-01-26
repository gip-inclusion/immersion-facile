import { PoolClient } from "pg";
import format from "pg-format";
import { SiretDto } from "shared";
import { EstablishmentGroupEntity } from "../../../domain/immersionOffer/entities/EstablishmentGroupEntity";
import { EstablishmentGroupRepository } from "../../../domain/immersionOffer/ports/EstablishmentGroupRepository";

export class PgEstablishmentGroupRepository
  implements EstablishmentGroupRepository
{
  constructor(private client: PoolClient) {}

  async create(group: EstablishmentGroupEntity): Promise<void> {
    await this.client.query(
      `
            INSERT INTO establishment_groups (name) VALUES ($1)
        `,
      [group.name],
    );

    const groupAndSiretPairs: [string, SiretDto][] = group.sirets.map(
      (siret) => [group.name, siret],
    );
    await this.client.query(
      format(
        `INSERT INTO establishment_groups__sirets (group_name, siret) VALUES %L`,
        groupAndSiretPairs,
      ),
    );
  }
}
