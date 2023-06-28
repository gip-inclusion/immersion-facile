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
    responses: { 200: isSiretExistResponseSchema },
  }),
  getSiretInfo: defineRoute({
    method: "get",
    url: `/siret/:siret`,
    responses: { 200: getSiretInfoSchema },
  }),
  getSiretInfoIfNotAlreadySaved: defineRoute({
    method: "get",
    url: `/siret-if-not-saved/:siret`,
    responses: { 200: getSiretInfoSchema },
  }),
});
