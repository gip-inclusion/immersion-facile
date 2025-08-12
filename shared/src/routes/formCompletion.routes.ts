import { defineRoute, defineRoutes } from "shared-routes";
import { z } from "zod";
import { httpErrorSchema } from "../httpClient/httpErrors.schema";
import { appellationSearchResponseSchema } from "../romeAndAppellationDtos/romeAndAppellation.schema";
import { searchTextSchema } from "../search/searchText.schema";
import {
  getSiretInfoSchema,
  isSiretExistResponseSchema,
} from "../siret/siret.schema";

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
      400: httpErrorSchema,
      404: httpErrorSchema,
      409: httpErrorSchema,
      429: httpErrorSchema,
      503: httpErrorSchema,
    },
  }),
  getSiretInfoIfNotAlreadySaved: defineRoute({
    method: "get",
    url: "/siret-if-not-saved/:siret",
    responses: {
      200: getSiretInfoSchema,
      400: httpErrorSchema,
      404: httpErrorSchema,
      409: httpErrorSchema,
      429: httpErrorSchema,
      503: httpErrorSchema,
    },
  }),
  appellation: defineRoute({
    method: "get",
    url: "/appellation",
    queryParamsSchema: z.object({
      searchText: searchTextSchema,
      naturalLanguage: z.literal("true").optional(),
    }),
    responses: {
      200: appellationSearchResponseSchema,
    },
  }),
});
