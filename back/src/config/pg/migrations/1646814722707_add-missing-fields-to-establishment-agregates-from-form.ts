import { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  // Create columns
  pgm.addColumns("establishments", {
    customized_name: { type: "varchar(255)" },
    is_commited: { type: "boolean" },
    naf_nomenclature: { type: "varchar(255)" },
  });
  pgm.addColumn("immersion_offers", {
    rome_appellation: { type: "integer" },
  });

  // Retrieve data from forms

  // Easy ones : set Naf nomenclature, is commited and customized name
  // ------------------------------------------------------------------
  await pgm.sql(`
    WITH from_form AS 
      (SELECT 
        siret, 
        is_engaged_enterprise,
        business_name_customized,
        naf ->> 'nomenclature' AS naf_nomenclature
       FROM form_establishments) 
    UPDATE establishments
    SET naf_nomenclature = from_form.naf_nomenclature,
        is_commited = from_form.is_engaged_enterprise,
        customized_name = from_form.business_name_customized FROM from_form
    WHERE establishments.siret = from_form.siret;`);

  // More complex : infer immersion offers rome appellation from 'professions' column in forms (and a bit of necessary cleanup in immersion_offers table)
  // -----------------------------------------------------------------------------------------

  // 0. Create a view with re-constructed offers from form to help build the other queries
  // This view gives [siret, infered_rome, infered_appellation], built from form_establishments and public_rome_appelation (15,773  rows)
  // It proceeds as follow :
  //   1. flatten the JSON in column 'professions'
  //   2. fill missing rome code using public_rome_appellation (jointure)
  //   3. fill missing rome appellation using public_rome_appellations (take first match for the given rome code)
  const selectAllCompleteOffersFromFormEstablishments = `
      WITH unnested_professions as 
      (with tmp_unnest as
        (with tmp as (SELECT 
          siret, 
          jsonb_array_elements(professions::jsonb) AS profession
        FROM form_establishments)
              SELECT 
                siret, 
              (profession ->> 'romeCodeAppellation')::integer AS profession_rome_appellation,
              (profession ->> 'romeCodeMetier' ) AS profession_rome
        FROM tmp)
        select siret, profession_rome_appellation, 
        COALESCE(profession_rome, pad.code_rome) as infered_rome
        from tmp_unnest 
        left join public_appelations_data pad on pad.ogr_appellation = tmp_unnest.profession_rome_appellation
        ),
      first_rome_appellation AS 
          (SELECT distinct  ON (code_rome) code_rome, ogr_appellation FROM public_appelations_data)
      SELECT up.siret, up.infered_rome,
      COALESCE(up.profession_rome_appellation, fra.ogr_appellation) as infered_appellation from unnested_professions up 
      join first_rome_appellation fra on fra.code_rome = up.infered_rome`;

  // 1. Remove offers of etablishments from form that are not referenced in form
  // Those have been inserted clandestinely by La Bonne Boite (about 4,000 offers will be removed)
  const sqlRemove = `
  DELETE FROM immersion_offers WHERE uuid IN (
    WITH all_offers_infered_from_form AS (${selectAllCompleteOffersFromFormEstablishments}), 
    immersion_offers_with_form_source AS (
    SELECT io.* FROM immersion_offers io JOIN form_establishments fe ON fe.siret = io.siret
    )
    SELECT io.uuid
    FROM all_offers_infered_from_form aoiff 
    FULL OUTER JOIN immersion_offers_with_form_source io 
    ON io.siret = aoiff.siret AND aoiff.infered_rome = io.rome
    WHERE aoiff.siret is null
    ) 
`;
  await pgm.sql(sqlRemove);

  // 2. Set one of appellation for each offer in table. In order to keep the uuid, we do not remove the existing offer,
  // but instead, we infer on of the declared 'appellation' from form. - about 13,000 rows will be edited
  const sqlSet = `
  WITH offer_appellation_and_rome_by_siret as 
  (${selectAllCompleteOffersFromFormEstablishments}),
  immersion_offers_source_form AS (
  SELECT immersion_offers.siret, immersion_offers.rome 
  FROM immersion_offers 
  JOIN establishments ON immersion_offers.siret = establishments.siret WHERE data_source='form'
  )
  UPDATE immersion_offers
  SET 
  rome_appellation = infered_appellation
  FROM offer_appellation_and_rome_by_siret from_form
  JOIN immersion_offers_source_form from_io ON from_form.siret = from_io.siret AND from_form.infered_rome = from_io.rome
  WHERE immersion_offers.siret = from_io.siret 
  AND immersion_offers.rome = from_io.rome`;

  await pgm.sql(sqlSet);

  // 3. Insert missing offers : for one establishment, it might be multiple rome appellations that lead
  // to the same rome (hence to only 1 offer instead of many) - 2,700 offers will be added
  const sqlInsert = `
  WITH missing_offers_from_form AS (
  WITH all_offers_from_form AS (${selectAllCompleteOffersFromFormEstablishments})
    SELECT DISTINCT aoff.siret, aoff.infered_rome, aoff.infered_appellation 
    FROM all_offers_from_form aoff
    LEFT JOIN immersion_offers io 
        ON aoff.siret = io.siret and aoff.infered_appellation = io.rome_appellation 
    WHERE uuid IS NULL)
  INSERT into immersion_offers (uuid, rome, siret, rome_appellation, score)
  SELECT gen_random_uuid(), infered_rome, e.siret, infered_appellation, 10 
  FROM missing_offers_from_form
  JOIN establishments e on e.siret = missing_offers_from_form.siret 
  `; // NB : Last join with table establishments is  due to the fact than some siret in form_establishments are not in establishments table (abnormal)
  await pgm.sql(sqlInsert);

  pgm.renameColumn("establishments", "naf", "naf_code");
  pgm.renameColumn("immersion_offers", "rome", "rome_code");

  // Add foreign key on rome_appellation to reference table public_appelations_data
  pgm.addConstraint("immersion_offers", "fk_rome_appellation", {
    foreignKeys: {
      columns: "rome_appellation",
      references: "public_appelations_data(ogr_appellation)",
    },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("establishments", [
    "customized_name",
    "is_commited",
    "naf_nomenclature",
  ]);
  pgm.dropColumn("immersion_offers", "rome_appellation");
  pgm.renameColumn("establishments", "naf_code", "naf");
  pgm.renameColumn("immersion_offers", "rome_code", "rome");
}
