/* eslint-disable @typescript-eslint/naming-convention */
import { MigrationBuilder } from "node-pg-migrate";
const viewEstablishmentsWithAggregatedOffers =
  "view_establishments_with_aggregated_offers";
const viewEstablishmentWithFlattenOffers =
  "view_establishments_with_flatten_offers";
export async function up(pgm: MigrationBuilder): Promise<void> {
  dropAndRecreateView(
    pgm,
    viewEstablishmentsWithAggregatedOffers,
    make_view_establishments_with_aggregated_offers_sql("up"),
  );
  dropAndRecreateView(
    pgm,
    viewEstablishmentWithFlattenOffers,
    make_view_establishments_with_flatten_offers_sql("up"),
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  dropAndRecreateView(
    pgm,
    viewEstablishmentsWithAggregatedOffers,
    make_view_establishments_with_aggregated_offers_sql("down"),
  );
  dropAndRecreateView(
    pgm,
    viewEstablishmentWithFlattenOffers,
    make_view_establishments_with_flatten_offers_sql("down"),
  );
}

const make_view_establishments_with_aggregated_offers_sql = (
  migrate: "up" | "down",
) => `
  WITH offers_by_siret AS (
    SELECT e.siret,
      ${
        migrate === "up"
          ? "array_agg(pad.libelle_appellation_long) AS appelation_labels,"
          : "array_agg(prd.libelle_rome) AS rome_labels,"
      }
      array_agg(io_1.rome_code) AS rome_codes
      FROM ((establishments e
        LEFT JOIN immersion_offers io_1 ON ((io_1.siret = e.siret)))
        ${
          migrate === "up"
            ? "LEFT JOIN public_appellations_data pad ON ((((pad.code_rome)::bpchar = io_1.rome_code) AND (pad.ogr_appellation = io_1.rome_appellation))))"
            : "LEFT JOIN public_romes_data prd ON ((prd.code_rome = io_1.rome_code)))"
        }
    WHERE (e.data_source = 'form'::text)
    GROUP BY e.siret
  )
  SELECT view_establishments."Date de référencement",
  view_establishments."Date de mise à jour",
  view_establishments."Siret",
  view_establishments."Raison Sociale",
  view_establishments."Enseigne",
  view_establishments."Adresse",
  view_establishments."Code Postal",
  view_establishments."Ville",
  view_establishments."Département",
  view_establishments."Région",
  view_establishments."NAF",
  view_establishments."Division NAF",
  view_establishments."Nombre d’employés",
  view_establishments."Contact",
  view_establishments."Rôle du contact",
  view_establishments."Email du contact",
  view_establishments."Téléphone du contact",
  view_establishments."Mode de contact",
  view_establishments."Appartenance Réseau « Les entreprises s’engagent »",
  view_establishments."Visible",
  view_establishments."Origine",
  view_establishments."Nombre de mise en relation pour cette entreprise",
  view_establishments."Nombre de convention validée pour cette entreprise",
  io.rome_codes AS "Codes Métier",
  ${
    migrate === "up"
      ? `io.appelation_labels AS "Métiers"`
      : `io.rome_labels AS "Métiers"`
  }
  FROM (view_establishments
  LEFT JOIN offers_by_siret io ON ((io.siret = view_establishments."Siret")));
`;

const make_view_establishments_with_flatten_offers_sql = (
  migrate: "up" | "down",
) => `
  WITH offers_by_siret AS (
    SELECT e.siret,
      ${
        migrate === "up"
          ? "pad.libelle_appellation_long AS appelation_labels,"
          : "prd.libelle_rome AS rome_label,"
      }
      io_1.rome_code
      FROM ((establishments e
        LEFT JOIN immersion_offers io_1 ON ((io_1.siret = e.siret)))
        ${
          migrate === "up"
            ? "LEFT JOIN public_appellations_data pad ON ((pad.code_rome = io_1.rome_code AND pad.ogr_appellation = io_1.rome_appellation)))"
            : "LEFT JOIN public_romes_data prd ON ((prd.code_rome = io_1.rome_code)))"
        }
    WHERE (e.data_source = 'form'::text)
  )
  SELECT view_establishments."Date de référencement",
  view_establishments."Date de mise à jour",
  view_establishments."Siret",
  view_establishments."Raison Sociale",
  view_establishments."Enseigne",
  view_establishments."Adresse",
  view_establishments."Code Postal",
  view_establishments."Ville",
  view_establishments."Département",
  view_establishments."Région",
  view_establishments."NAF",
  view_establishments."Division NAF",
  view_establishments."Nombre d’employés",
  view_establishments."Contact",
  view_establishments."Rôle du contact",
  view_establishments."Email du contact",
  view_establishments."Téléphone du contact",
  view_establishments."Mode de contact",
  view_establishments."Appartenance Réseau « Les entreprises s’engagent »",
  view_establishments."Visible",
  view_establishments."Origine",
  view_establishments."Nombre de mise en relation pour cette entreprise",
  view_establishments."Nombre de convention validée pour cette entreprise",
  io.rome_code AS "Code Métier",
  ${
    migrate === "up"
      ? `io.appelation_labels AS "Métier"`
      : `io.rome_label AS "Métier"`
  }
  FROM (view_establishments
  LEFT JOIN offers_by_siret io ON ((io.siret = view_establishments."Siret")));
`;
function dropAndRecreateView(
  pgm: MigrationBuilder,
  viewName: string,
  viewSql: string,
) {
  pgm.dropMaterializedView(viewName);
  pgm.createMaterializedView(viewName, {}, viewSql);
}
