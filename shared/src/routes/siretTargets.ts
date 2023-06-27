import { defineRoute, defineRoutes } from "shared-routes";
import {
  getSiretInfoSchema,
  isSiretExistResponseSchema,
} from "../siret/siret.schema";

export type SiretTargets = typeof siretTargets;
export const siretTargets = defineRoutes({
  isSiretAlreadySaved: defineRoute({
    method: "get",
    url: "/form-already-exists/:siret",
    responseBodySchema: isSiretExistResponseSchema,
  }),
  getSiretInfo: defineRoute({
    method: "get",
    url: `/siret/:siret`,
    responseBodySchema: getSiretInfoSchema,
  }),
  getSiretInfoIfNotAlreadySaved: defineRoute({
    method: "get",
    url: `/siret-if-not-saved/:siret`,
    responseBodySchema: getSiretInfoSchema,
  }),
});
