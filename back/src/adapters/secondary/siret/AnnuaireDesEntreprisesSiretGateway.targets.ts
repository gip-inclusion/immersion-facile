import { z } from "zod";
import { createTarget, createTargets } from "http-client";

const adeEstablishmentSchema = z.object({
  nom_complet: z.string(),
  matching_etablissements: z
    .array(
      z.object({
        siret: z.string(),
        etat_administratif: z.enum(["A", "F"]),
        adresse: z.string(),
      }),
    )
    .min(1),
  activite_principale: z.string(),
  tranche_effectif_salarie: z.string().nullable(),
});

const annuaireDesEntreprisesSiretGatewayResponseSchema = z.object({
  results: z.array(adeEstablishmentSchema),
  total_results: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
});

export type AnnuaireDesEntreprisesSiretEstablishment = {
  // cf. https://api.gouv.fr/documentation/api-recherche-entreprises
  nom_complet: string;
  matching_etablissements: {
    siret: string;
    etat_administratif: "A" | "F";
    adresse: string;
  }[];
  activite_principale: string;
  tranche_effectif_salarie: string | null;
};

export type AnnuaireDesEntreprisesSiretGatewayResponse = {
  results: AnnuaireDesEntreprisesSiretEstablishment[];
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
};

export const annuaireDesEntreprisesSiretTargets = createTargets({
  search: createTarget({
    method: "GET",
    url: "https://recherche-entreprises.api.gouv.fr/search",
    validateQueryParams: (queryParams) => queryParams as { q: string },
    validateResponseBody:
      annuaireDesEntreprisesSiretGatewayResponseSchema.parse,
  }),
});

export type AnnuaireDesEntreprisesSiretTargets =
  typeof annuaireDesEntreprisesSiretTargets;
