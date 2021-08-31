import { createRouter, defineRoute, param } from "type-route";

export const { RouteProvider, useRoute, routes } = createRouter({
  home: defineRoute("/"),
  todos: defineRoute("/todos"),
  demandeImmersion: defineRoute(
    {
      demandeId: param.query.optional.string,
    },
    () => `/demande-immersion`
  ),
  admin: defineRoute("/admin"),
});
