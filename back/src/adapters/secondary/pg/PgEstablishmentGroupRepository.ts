import { PoolClient } from "pg";
import format from "pg-format";
import {
  EstablishmentGroupSlug,
  SearchImmersionResultDto,
  SiretDto,
} from "shared";
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
    slug: EstablishmentGroupSlug,
  ): Promise<SearchImmersionResultDto[]> {
    const response = await this.client.query(
      `
      SELECT JSON_STRIP_NULLS(JSON_BUILD_OBJECT(
        'rome', io.rome_code, 
        'siret', e.siret, 
        'distance_m', 0, 
        'name', e.name, 
        'website', e.website, 
        'additionalInformation', e.additional_information, 
        'customizedName', e.customized_name, 
        'voluntaryToImmersion', true,
        'fitForDisabledWorkers', e.fit_for_disabled_workers,
        'position', JSON_BUILD_OBJECT('lon', e.lon, 'lat', e.lat), 
        'romeLabel', r.libelle_rome,
        'appellationLabels',  COALESCE(JSON_AGG(DISTINCT ap.libelle_appellation_long) FILTER (WHERE ap.libelle_appellation_long IS NOT NULL), '[]'),
        'naf', e.naf_code,
        'nafLabel', public_naf_classes_2008.class_label,
        'address', JSON_BUILD_OBJECT(
            'streetNumberAndAddress', e.street_number_and_address, 
            'postcode', e.post_code,
            'city', e.city,
            'departmentCode', e.department_code
         ),
        'contactMode', ic.contact_mode,
        'numberOfEmployeeRange', e.number_employees 
      )) as search_result_dto
      FROM "establishment_groups__sirets"
      LEFT JOIN "establishment_groups" g ON g.slug = establishment_groups__sirets.group_slug
      LEFT JOIN "establishments" e ON e.siret = establishment_groups__sirets.siret
      LEFT JOIN "immersion_offers" io ON io.siret = e.siret
      LEFT JOIN "establishments__immersion_contacts" AS eic ON eic.establishment_siret = e.siret
      LEFT JOIN "immersion_contacts" AS ic ON ic.uuid = eic.contact_uuid
      LEFT JOIN "public_appellations_data" ap ON ap.ogr_appellation = io.rome_appellation
      LEFT JOIN "public_romes_data" r ON io.rome_code = r.code_rome
      LEFT JOIN "public_naf_classes_2008" ON (public_naf_classes_2008.class_id = REGEXP_REPLACE(naf_code,'(\\d\\d)(\\d\\d).', '\\1.\\2'))
      WHERE establishment_groups__sirets.group_slug = $1 AND e.is_active AND e.is_searchable
      GROUP BY(e.siret, io.rome_code, r.libelle_rome, public_naf_classes_2008.class_label, ic.contact_mode)
    `,
      [slug],
    );

    return response.rows.map((row) => row.search_result_dto);
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

  private async clearExistingSiretsForGroup(groupSlug: EstablishmentGroupSlug) {
    await this.client.query(
      `DELETE FROM establishment_groups__sirets WHERE group_slug = $1`,
      [groupSlug],
    );
  }
}
