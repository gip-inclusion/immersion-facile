import { useEffect } from "react";
import { objectToDependencyList } from "shared";
import { useDebounce } from "src/app/hooks/useDebounce";
import { ConventionParamsInUrl } from "src/app/routes/routeParams/convention";
import { routes, useRoute } from "src/app/routes/routes";

export const useUpdateConventionValuesInUrl = (
  watchedValues: ConventionParamsInUrl,
) => {
  const route = useRoute();
  useEffect(() => {
    if (
      (route.name !== "conventionImmersion" &&
        route.name !== "conventionImmersionForExternals" &&
        route.name !== "conventionCustomAgency" &&
        route.name !== "conventionMiniStage") ||
      !!route.params.jwt
    )
      return;

    if (
      route.name === "conventionImmersion" ||
      route.name === "conventionCustomAgency" ||
      route.name === "conventionMiniStage"
    ) {
      routes[route.name](watchedValues).replace();
    }

    if (route.name === "conventionImmersionForExternals") {
      routes
        .conventionImmersionForExternals({
          ...watchedValues,
          consumer: route.params.consumer,
        })
        .replace();
    }
  }, useDebounce(objectToDependencyList(watchedValues)));
};
