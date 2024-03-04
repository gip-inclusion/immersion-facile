import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { legacyHttpErrorSchema } from "../httpClient/httpErrors.schema";
import { appellationSearchResponseSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import {
  getSiretInfoSchema,
  isSiretExistResponseSchema,
} from "../siret/siret.schema";
import { zStringMinLength1 } from "../zodUtils";

export type FormCompletionRoutes = typeof formCompletionRoutes;
export const formCompletionRoutes = defineRoutes({
  isSiretAlreadySaved: defineRoute({
    method: "get",
    url: "/form-already-exists/:siret",
    responses: { 200: isSiretExistResponseSchema },
  }),
  getSiretInfo: defineRoute({
    method: "get",
    url: "/siret/:siret",
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
    url: "/siret-if-not-saved/:siret",
    responses: {
      200: getSiretInfoSchema,
      400: legacyHttpErrorSchema,
      404: legacyHttpErrorSchema,
      409: legacyHttpErrorSchema,
      429: legacyHttpErrorSchema,
      503: legacyHttpErrorSchema,
    },
  }),
  appellation: defineRoute({
    method: "get",
    url: "/appellation",
    queryParamsSchema: z.object({
      searchText: zStringMinLength1,
      naturalLanguage: z.literal("true").optional(),
    }),
    responses: {
      200: appellationSearchResponseSchema,
    },
  }),
});
