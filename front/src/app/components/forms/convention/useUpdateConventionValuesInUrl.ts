import { useEffect } from "react";
import { objectToDependencyList } from "shared";
import { useDebounce } from "src/app/hooks/useDebounce";
import { ConventionParamsInUrl } from "src/app/routes/routeParams/convention";
import {
  conventionForExternalParams,
  conventionParams,
  routes,
  useRoute,
} from "src/app/routes/routes";
import {
  filterParamsForRoute,
  getUrlParameters,
} from "src/app/utils/url.utils";

export const useUpdateConventionValuesInUrl = (
  watchedValues: ConventionParamsInUrl,
) => {
  const route = useRoute();
  const urlParams = getUrlParameters(window.location);

  useEffect(
    () => {
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
        const filteredParams = filterParamsForRoute(
          urlParams,
          conventionParams,
        );
        routes[route.name]({ ...filteredParams, ...watchedValues }).replace();
      }

      if (route.name === "conventionImmersionForExternals") {
        const filteredParams = filterParamsForRoute(
          urlParams,
          conventionForExternalParams,
        );
        routes
          .conventionImmersionForExternals({
            ...filteredParams,
            ...watchedValues,
            consumer: route.params.consumer,
          })
          .replace();
      }
    },
    useDebounce(objectToDependencyList(watchedValues)),
  );
};
