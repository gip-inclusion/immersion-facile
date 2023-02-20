import { PoolClient } from "pg";
import format from "pg-format";
import { SearchImmersionResultDto, SiretDto } from "shared";
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

  public async findSearchImmersionResultsBySlug(
    slug: string,
  ): Promise<SearchImmersionResultDto[]> {
    const response = await this.client.query(
      `
      SELECT slug, establishment_groups__sirets.siret, g.name AS group_name,
        e.name AS establishment_name,e.street_number_and_address, e.post_code, e.city, e.department_code, e.lat, e.lon
      FROM establishment_groups__sirets
      LEFT JOIN establishment_groups g ON g.slug = establishment_groups__sirets.group_slug
      LEFT JOIN establishments e ON e.siret = establishment_groups__sirets.siret
      WHERE establishment_groups__sirets.group_slug = $1
    `,
      [slug],
    );

    return response.rows;
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
