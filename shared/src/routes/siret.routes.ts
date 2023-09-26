import { defineRoute, defineRoutes } from "shared-routes";
import { legacyBadRequestErrorSchema } from "../httpClient/errors/httpErrors.schema";
import {
  getSiretInfoSchema,
  isSiretExistResponseSchema,
} from "../siret/siret.schema";

export type SiretRoutes = typeof siretRoutes;
export const siretRoutes = defineRoutes({
  isSiretAlreadySaved: defineRoute({
    method: "get",
    url: "/form-already-exists/:siret",
    responses: { 200: isSiretExistResponseSchema },
  }),
  getSiretInfo: defineRoute({
    method: "get",
    url: `/siret/:siret`,
    responses: {
      200: getSiretInfoSchema,
      400: legacyBadRequestErrorSchema,
      404: legacyBadRequestErrorSchema,
    },
  }),
  getSiretInfoIfNotAlreadySaved: defineRoute({
    method: "get",
    url: `/siret-if-not-saved/:siret`,
    responses: {
      200: getSiretInfoSchema,
      409: legacyBadRequestErrorSchema,
    },
  }),
});
