import { defineRoute, defineRoutes } from "shared-routes";
import { nafSectionSuggestionsSchema } from "./naf.schema";

export type NafRoutes = typeof nafRoutes;

export const nafRoutes = defineRoutes({
  getAllNafSections: defineRoute({
    method: "get",
    url: "/naf/section",
    responses: {
      200: nafSectionSuggestionsSchema,
    },
  }),
});
