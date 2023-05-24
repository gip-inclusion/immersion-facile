import { createTarget, createTargets } from "http-client";
import {
  getSiretInfoSchema,
  isSiretExistResponseSchema,
} from "../siret/siret.schema";

const siretRoute = "siret";
const getSiretIfNotSavedRoute = "siret-if-not-saved";
export type SiretTargets = typeof siretTargets;
export const siretTargets = createTargets({
  isSiretAlreadySaved: createTarget({
    method: "GET",
    url: "/form-already-exists/:siret",
    validateResponseBody: isSiretExistResponseSchema.parse,
  }),
  getSiretInfo: createTarget({
    method: "GET",
    url: `/${siretRoute}/:siret`,
    validateResponseBody: getSiretInfoSchema.parse,
  }),
  getSiretInfoIfNotAlreadySaved: createTarget({
    method: "GET",
    url: `/${getSiretIfNotSavedRoute}/:siret`,
    validateResponseBody: getSiretInfoSchema.parse,
  }),
});
