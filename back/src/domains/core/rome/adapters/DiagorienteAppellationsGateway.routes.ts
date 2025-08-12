import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod/v4";
import {
  diagorienteAccessTokenQueryParamsSchema,
  diagorienteAccessTokenResponseSchema,
  diagorienteQueryParamsSchema,
  diagorienteRawResponseSchema,
} from "./DiagorienteAppellationsGateway.schemas";

export type DiagorienteAppellationsRoutes =
  typeof diagorienteAppellationsRoutes;

const diagorienteErrorResponseBodySchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
});

export const diagorienteAppellationsRoutes = defineRoutes({
  searchAppellations: defineRoute({
    method: "get",
    url: "https://semafor.diagoriente.fr/search/Appellations",
    queryParamsSchema: diagorienteQueryParamsSchema,
    responses: {
      200: diagorienteRawResponseSchema,
      400: diagorienteErrorResponseBodySchema,
      401: diagorienteErrorResponseBodySchema,
      403: z.string(),
    },
  }),
  getAccessToken: defineRoute({
    method: "post",
    url: "https://analytics-auth.atlantis.diagotech.dev/realms/esi-auth-keycloack/protocol/openid-connect/token",
    requestBodySchema: diagorienteAccessTokenQueryParamsSchema,
    responses: {
      200: diagorienteAccessTokenResponseSchema,
      400: diagorienteErrorResponseBodySchema,
      401: diagorienteErrorResponseBodySchema,
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

// Use only useful props since diagoriente API props are not stable
export type DiagorienteResultData = {
  // _key: string;
  // _id: string;
  // _rev: string;
  titre: string;
  // tags: unknown[];
  code_ogr: string;
  // transition_ecologique: boolean;
  // transition_numerique: boolean;
  // transition_demographique: boolean;
  // metier_avenir: boolean;
  // metier_art: boolean;
  // metier_en_tension: boolean;
  // metier_resilience: boolean;
  // principale: boolean;
  // description: unknown;
  // id: string;
};

export type DiagorienteAccessTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  "not-before-policy": number;
  scope: string;
};
