import { defineRoute, defineRoutes } from "shared-routes";
import { httpErrorSchema } from "../httpClient/httpErrors.schema";
import {
  sectionSuggestionsParamsSchema,
  sectionSuggestionsSchema,
} from "./naf.schema";

export type NafRoutes = typeof nafRoutes;

export const nafRoutes = defineRoutes({
  sectionSuggestions: defineRoute({
    method: "get",
    url: "/naf/section",
    queryParamsSchema: sectionSuggestionsParamsSchema,
    responses: {
      200: sectionSuggestionsSchema,
      400: httpErrorSchema,
    },
  }),
});
