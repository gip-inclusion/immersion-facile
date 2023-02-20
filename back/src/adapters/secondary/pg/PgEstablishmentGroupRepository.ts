import { PoolClient } from "pg";
import format from "pg-format";
import { SiretDto } from "shared";
import { EstablishmentGroupEntity } from "../../../domain/immersionOffer/entities/EstablishmentGroupEntity";
import { EstablishmentGroupRepository } from "../../../domain/immersionOffer/ports/EstablishmentGroupRepository";

export class PgEstablishmentGroupRepository
  implements EstablishmentGroupRepository
{
  constructor(private client: PoolClient) {}

  async save(group: EstablishmentGroupEntity): Promise<void> {
    const { rows } = await this.client.query(
      `SELECT * FROM establishment_groups WHERE slug = $1`,
      [group.slug],
    );
    const establishmentGroupAlreadyExists = !!rows.length;
    if (establishmentGroupAlreadyExists) {
      await this.clearExistingSiretsForGroup(group.slug);
      await this.insertEstablishmentGroupSirets(group);
    } else {
      await this.client.query(
        `
            INSERT INTO establishment_groups (slug, name) VALUES ($1, $2)
        `,
        [group.slug, group.name],
      );
      await this.insertEstablishmentGroupSirets(group);
    }
  }

  private async insertEstablishmentGroupSirets(
    group: EstablishmentGroupEntity,
  ) {
    if (!group.sirets.length) return;
    const groupAndSiretPairs: [string, SiretDto][] = group.sirets.map(
      (siret) => [group.slug, siret],
    );

    await this.client.query(
      format(
        `INSERT INTO establishment_groups__sirets (group_slug, siret) VALUES %L`,
        groupAndSiretPairs,
      ),
    );
  }

  private async clearExistingSiretsForGroup(groupSlug: string) {
    await this.client.query(
      `DELETE FROM establishment_groups__sirets WHERE group_slug = $1`,
      [groupSlug],
    );
  }
}
