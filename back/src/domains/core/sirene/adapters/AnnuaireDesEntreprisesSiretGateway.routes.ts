import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";

const adeEstablishmentSchema = z.object({
  matching_etablissements: z
    .array(
      z.object({
        siret: z.string(),
        etat_administratif: z.enum(["A", "F"]),
        adresse: z.string(),
        nom_commercial: z.string().nullable(),
      }),
    )
    .min(1),
  nom_complet: z.string(),
  activite_principale: z.string(),
  tranche_effectif_salarie: z.string().nullable(),
});

const annuaireDesEntreprisesSiretGatewayResponseSchema: z.Schema<AnnuaireDesEntreprisesSiretGatewayResponse> =
  z.object({
    results: z.array(adeEstablishmentSchema),
    total_results: z.number(),
    page: z.number(),
    per_page: z.number(),
    total_pages: z.number(),
  });

export type AnnuaireDesEntreprisesSiretEstablishment = {
  // cf. https://api.gouv.fr/documentation/api-recherche-entreprises
  matching_etablissements: {
    siret: string;
    etat_administratif: "A" | "F";
    adresse: string;
    nom_commercial: string | null;
  }[];
  nom_complet: string;
  activite_principale: string;
  tranche_effectif_salarie: string | null;
};

type AnnuaireDesEntreprisesSiretGatewayResponse = {
  results: AnnuaireDesEntreprisesSiretEstablishment[];
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
};

const annuaireDesEntreprisesQueryParamsSchema: z.Schema<{ q: string }> =
  z.any();

export const annuaireDesEntreprisesSiretRoutes = defineRoutes({
  search: defineRoute({
    method: "get",
    url: "https://recherche-entreprises.api.gouv.fr/search",

    queryParamsSchema: annuaireDesEntreprisesQueryParamsSchema,
    responses: {
      200: annuaireDesEntreprisesSiretGatewayResponseSchema,
    },
  }),
});

export type AnnuaireDesEntreprisesSiretRoutes =
  typeof annuaireDesEntreprisesSiretRoutes;
