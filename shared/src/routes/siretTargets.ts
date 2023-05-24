import { createTarget, createTargets } from "http-client";
import {
  getSiretInfoSchema,
  isSiretExistResponseSchema,
} from "../siret/siret.schema";

export type SiretTargets = typeof siretTargets;
export const siretTargets = createTargets({
  isSiretAlreadySaved: createTarget({
    method: "GET",
    url: "/form-already-exists/:siret",
    validateResponseBody: isSiretExistResponseSchema.parse,
  }),
  getSiretInfo: createTarget({
    method: "GET",
    url: `/siret/:siret`,
    validateResponseBody: getSiretInfoSchema.parse,
  }),
  getSiretInfoIfNotAlreadySaved: createTarget({
    method: "GET",
    url: `/siret-if-not-saved/:siret`,
    validateResponseBody: getSiretInfoSchema.parse,
  }),
});
