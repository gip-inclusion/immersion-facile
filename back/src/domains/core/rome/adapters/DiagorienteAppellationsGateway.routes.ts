import { defineRoute, defineRoutes } from "shared-routes";
import {
  diagorienteAccessTokenQueryParamsSchema,
  diagorienteAccessTokenResponseSchema,
  diagorienteQueryParamsSchema,
  diagorienteRawResponseSchema,
} from "./DiagorienteAppellationsGateway.schemas";

export type DiagorienteAppellationsRoutes =
  typeof diagorienteAppellationsRoutes;

export const diagorienteAppellationsRoutes = defineRoutes({
  searchAppellations: defineRoute({
    method: "get",
    url: "https://recherche-referentiel-v2.prod.analytics.diagotech.dev/search/Appellations",
    queryParamsSchema: diagorienteQueryParamsSchema,
    responses: {
      200: diagorienteRawResponseSchema,
    },
  }),
  getAccessToken: defineRoute({
    method: "post",
    url: "https://auth.prod.analytics.diagotech.dev/realms/esi-auth-keycloack/protocol/openid-connect/token",
    requestBodySchema: diagorienteAccessTokenQueryParamsSchema,
    responses: {
      200: diagorienteAccessTokenResponseSchema,
    },
  }),
});

export const diagorienteTokenScope: keyof DiagorienteAccessTokenResponse =
  "expires_in";

export type DiagorienteRawResponse = {
  search_results: DiagorienteSearchResult[];
};

export type DiagorienteSearchResult = {
  text: string;
  similarity: number;
  data: DiagorienteResultData;
};

export type DiagorienteResultData = {
  _key: string;
  _id: string;
  _rev: string;
  titre: string;
  tags: unknown[];
  code_ogr: string;
  transition_ecologique: boolean;
  transition_numerique: boolean;
  transition_demographique: boolean;
  metier_avenir: boolean;
  metier_art: boolean;
  metier_en_tension: boolean;
  metier_resilience: boolean;
  principale: boolean;
  description: unknown;
  id: string;
};

export type DiagorienteAccessTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  "not-before-policy": number;
  scope: string;
};
