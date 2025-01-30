import { defineRoute, defineRoutes } from "shared-routes";
import { httpErrorSchema } from "../httpClient/httpErrors.schema";
import {
  nafSectionSuggestionsParamsSchema,
  nafSectionSuggestionsSchema,
} from "./naf.schema";

export type NafRoutes = typeof nafRoutes;

export const nafRoutes = defineRoutes({
  nafSectionSuggestions: defineRoute({
    method: "get",
    url: "/naf/section",
    queryParamsSchema: nafSectionSuggestionsParamsSchema,
    responses: {
      200: nafSectionSuggestionsSchema,
      400: httpErrorSchema,
    },
  }),
});
