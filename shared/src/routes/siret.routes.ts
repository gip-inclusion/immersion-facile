import { defineRoute, defineRoutes } from "shared-routes";
import { legacyHttpErrorSchema } from "../httpClient/errors/httpErrors.schema";
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
      400: legacyHttpErrorSchema,
      404: legacyHttpErrorSchema,
      409: legacyHttpErrorSchema,
      429: legacyHttpErrorSchema,
      503: legacyHttpErrorSchema,
    },
  }),
  getSiretInfoIfNotAlreadySaved: defineRoute({
    method: "get",
    url: `/siret-if-not-saved/:siret`,
    responses: {
      200: getSiretInfoSchema,
      400: legacyHttpErrorSchema,
      404: legacyHttpErrorSchema,
      409: legacyHttpErrorSchema,
      429: legacyHttpErrorSchema,
      503: legacyHttpErrorSchema,
    },
  }),
});
