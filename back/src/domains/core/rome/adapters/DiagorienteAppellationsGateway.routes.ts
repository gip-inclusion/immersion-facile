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
    url: "https://recherche-referentiel.prod.analytics.diagotech.dev/search/oplc/appellation",
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
