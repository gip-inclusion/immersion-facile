import format from "pg-format";
import { GroupSlug, SearchResultDto, SiretDto } from "shared";
import { GroupEntity } from "../../../../domain/offer/entities/GroupEntity";
import { GroupRepository } from "../../../../domain/offer/ports/GroupRepository";
import { executeKyselyRawSqlQuery, KyselyDb } from "../kysely/kyselyUtils";

const buildAppellationsArray = `JSON_AGG(
    JSON_BUILD_OBJECT(
      'appellationCode', ogr_appellation::text,
      'appellationLabel', libelle_appellation_long
    )
    ORDER BY ogr_appellation
  )`;

export class PgGroupRepository implements GroupRepository {
  constructor(private transaction: KyselyDb) {}

  public async findSearchResultsBySlug(
    slug: GroupSlug,
  ): Promise<SearchResultDto[]> {
    const response = await executeKyselyRawSqlQuery(
      this.transaction,
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
        'appellations',  ${buildAppellationsArray},
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
      LEFT JOIN "public_appellations_data" ap ON ap.ogr_appellation = io.appellation_code
      LEFT JOIN "public_romes_data" r ON io.rome_code = r.code_rome
      LEFT JOIN "public_naf_classes_2008" ON (public_naf_classes_2008.class_id = REGEXP_REPLACE(naf_code,'(\\d\\d)(\\d\\d).', '\\1.\\2'))
      WHERE establishment_groups__sirets.group_slug = $1 AND e.is_open AND e.is_searchable
      GROUP BY(e.siret, io.rome_code, r.libelle_rome, public_naf_classes_2008.class_label, ic.contact_mode)
    `,
      [slug],
    );

    return response.rows.map((row) => row.search_result_dto);
  }

  public async groupsWithSiret(siret: SiretDto): Promise<GroupEntity[]> {
    const { rows } = await executeKyselyRawSqlQuery<{
      slug: string;
      name: string;
      sirets: string[];
    }>(
      this.transaction,
      `
      SELECT g.slug, g.name, array_agg(establishment_groups__sirets.siret) as sirets
      FROM establishment_groups g
      LEFT JOIN establishment_groups__sirets ON g.slug = establishment_groups__sirets.group_slug
      INNER JOIN (
        SELECT DISTINCT group_slug
        FROM establishment_groups__sirets
        WHERE siret = $1
      ) est_groups ON g.slug = est_groups.group_slug
      GROUP BY g.slug, g.name
      ORDER BY g.slug;
    `,
      [siret],
    );
    return rows.map(
      (row) =>
        ({
          name: row.name,
          sirets: row.sirets,
          slug: row.slug,
        } satisfies GroupEntity),
    );
  }

  public async save(group: GroupEntity): Promise<void> {
    const { rows } = await executeKyselyRawSqlQuery(
      this.transaction,
      `SELECT * FROM establishment_groups WHERE slug = $1`,
      [group.slug],
    );
    const establishmentGroupAlreadyExists = !!rows.length;
    if (establishmentGroupAlreadyExists) {
      await this.#clearExistingSiretsForGroup(group.slug);
      await this.#insertEstablishmentGroupSirets(group);
    } else {
      await executeKyselyRawSqlQuery(
        this.transaction,
        `
            INSERT INTO establishment_groups (slug, name) VALUES ($1, $2)
        `,
        [group.slug, group.name],
      );
      await this.#insertEstablishmentGroupSirets(group);
    }
  }

  async #insertEstablishmentGroupSirets(group: GroupEntity) {
    if (!group.sirets.length) return;
    const groupAndSiretPairs: [string, SiretDto][] = group.sirets.map(
      (siret) => [group.slug, siret],
    );

    await executeKyselyRawSqlQuery(
      this.transaction,
      format(
        `INSERT INTO establishment_groups__sirets (group_slug, siret) VALUES %L`,
        groupAndSiretPairs,
      ),
    );
  }

  async #clearExistingSiretsForGroup(groupSlug: GroupSlug) {
    await executeKyselyRawSqlQuery(
      this.transaction,
      `DELETE FROM establishment_groups__sirets WHERE group_slug = $1`,
      [groupSlug],
    );
  }
}
