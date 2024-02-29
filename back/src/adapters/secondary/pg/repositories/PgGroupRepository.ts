import {
  Group,
  GroupSlug,
  GroupWithResults,
  SiretDto,
  groupWithResultsSchema,
} from "shared";
import { GroupEntity } from "../../../../domains/establishment/entities/GroupEntity";
import { GroupRepository } from "../../../../domains/establishment/ports/GroupRepository";
import {
  KyselyDb,
  executeKyselyRawSqlQuery,
  jsonBuildObject,
  jsonStripNulls,
} from "../kysely/kyselyUtils";

const buildAppellationsArray = `JSON_AGG(
    JSON_BUILD_OBJECT(
      'appellationCode', ogr_appellation::text,
      'appellationLabel', libelle_appellation_long
    )
    ORDER BY ogr_appellation
  )`;

export class PgGroupRepository implements GroupRepository {
  constructor(private transaction: KyselyDb) {}

  public async getGroupWithSearchResultsBySlug(
    slug: GroupSlug,
  ): Promise<GroupWithResults | undefined> {
    const rawGroup = await this.transaction
      .selectFrom("groups")
      .where("slug", "=", slug)
      .selectAll()
      .executeTakeFirst();

    if (!rawGroup) return;

    const group: Group = {
      name: rawGroup.name,
      slug: rawGroup.slug,
      options: {
        heroHeader: {
          title: rawGroup.hero_header_title,
          description: rawGroup.hero_header_description,
          logoUrl: rawGroup.hero_header_logo_url ?? undefined,
          backgroundColor: rawGroup.hero_header_background_color ?? undefined,
        },
        tintColor: rawGroup.tint_color ?? undefined,
      },
    };

    const resultsResponse = await executeKyselyRawSqlQuery(
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
        'position', JSON_BUILD_OBJECT('lon', loc.lon, 'lat', loc.lat), 
        'romeLabel', r.libelle_rome,
        'appellations',  ${buildAppellationsArray},
        'naf', e.naf_code,
        'nafLabel', public_naf_classes_2008.class_label,
        'address', JSON_BUILD_OBJECT(
            'streetNumberAndAddress', loc.street_number_and_address, 
            'postcode', loc.post_code,
            'city', loc.city,
            'departmentCode', loc.department_code
         ),
        'contactMode', ic.contact_mode,
        'numberOfEmployeeRange', e.number_employees,
        'locationId', loc.id
      )) as search_result_dto
      FROM "groups__sirets"
      LEFT JOIN "groups" g ON g.slug = groups__sirets.group_slug
      LEFT JOIN "establishments" e ON e.siret = groups__sirets.siret
      LEFT JOIN "immersion_offers" io ON io.siret = e.siret
      LEFT JOIN "establishments__immersion_contacts" AS eic ON eic.establishment_siret = e.siret
      LEFT JOIN "immersion_contacts" AS ic ON ic.uuid = eic.contact_uuid
      LEFT JOIN "public_appellations_data" ap ON ap.ogr_appellation = io.appellation_code
      LEFT JOIN "public_romes_data" r ON io.rome_code = r.code_rome
      LEFT JOIN "public_naf_classes_2008" ON (public_naf_classes_2008.class_id = REGEXP_REPLACE(naf_code,'(\\d\\d)(\\d\\d).', '\\1.\\2'))
      LEFT JOIN establishments_locations loc ON e.siret = loc.establishment_siret
      WHERE groups__sirets.group_slug = $1 AND e.is_open AND e.is_searchable
      GROUP BY(e.siret, io.rome_code, r.libelle_rome, public_naf_classes_2008.class_label, ic.contact_mode, loc.lon, loc.lat, loc.street_number_and_address, loc.post_code, loc.city, loc.department_code, loc.id)
    `,
      [slug],
    );

    const results = resultsResponse.rows.map((row) => row.search_result_dto);

    return groupWithResultsSchema.parse({
      group,
      results,
    });
  }

  public async groupsWithSiret(siret: SiretDto): Promise<GroupEntity[]> {
    return this.transaction
      .with("uniq_groups", (qb) =>
        qb
          .selectFrom("groups__sirets")
          .select("groups__sirets.group_slug")
          .distinct()
          .where("siret", "=", siret),
      )
      .selectFrom("groups as g")
      .leftJoin("groups__sirets", "slug", "groups__sirets.group_slug")
      .innerJoin("uniq_groups", "g.slug", "uniq_groups.group_slug")
      .groupBy(["g.slug", "g.name"])
      .orderBy("g.slug")
      .select(({ fn, ref }) => [
        "g.slug",
        "g.name",
        fn.agg<string[]>("ARRAY_AGG", ["groups__sirets.siret"]).as("sirets"),
        jsonStripNulls(
          jsonBuildObject({
            heroHeader: jsonBuildObject({
              title: ref("hero_header_title"),
              description: ref("hero_header_description"),
              logoUrl: ref("hero_header_logo_url"),
              backgroundColor: ref("hero_header_background_color"),
            }),
            tintColor: ref("tint_color"),
          }),
        ).as("options"),
      ])
      .execute();
  }

  public async save(group: GroupEntity): Promise<void> {
    const pgGroups = await this.transaction
      .selectFrom("groups")
      .selectAll()
      .where("slug", "=", group.slug)
      .execute();

    const groupAlreadyExists = !!pgGroups.length;

    if (groupAlreadyExists) {
      await this.#clearExistingSiretsForGroup(group.slug);
      await this.#insertGroupSirets(group);
    } else {
      await this.transaction
        .insertInto("groups")
        .values({
          name: group.name,
          slug: group.slug,
          tint_color: group.options.tintColor,
          hero_header_title: group.options.heroHeader.title,
          hero_header_description: group.options.heroHeader.description,
          hero_header_background_color:
            group.options.heroHeader.backgroundColor,
          hero_header_logo_url: group.options.heroHeader.logoUrl,
        })
        .execute();
      await this.#insertGroupSirets(group);
    }
  }

  async #insertGroupSirets(group: GroupEntity) {
    if (!group.sirets.length) return;

    const groupAndSiretPairs = group.sirets.map((siret) => ({
      group_slug: group.slug,
      siret,
    }));

    await this.transaction
      .insertInto("groups__sirets")
      .values(groupAndSiretPairs)
      .execute();
  }

  async #clearExistingSiretsForGroup(groupSlug: GroupSlug) {
    await this.transaction
      .deleteFrom("groups__sirets")
      .where("group_slug", "=", groupSlug)
      .execute();
  }
}
