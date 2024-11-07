import { useEffect } from "react";
import { objectToDependencyList } from "shared";
import { useDebounce } from "src/app/hooks/useDebounce";
import { ConventionParamsInUrl } from "src/app/routes/routeParams/convention";
import { conventionParams, routes, useRoute } from "src/app/routes/routes";
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
          route.name !== "conventionMiniStage") ||
        !!route.params.jwt
      )
        return;

      if (
        route.name === "conventionImmersion" ||
        route.name === "conventionMiniStage"
      ) {
        const filteredParams = filterParamsForRoute({
          urlParams,
          matchingParams: conventionParams,
          forceExcludeParams: ["fedId", "fedIdProvider"],
        });
        const {
          fedId: _,
          fedIdProvider: __,
          ...watchedValuesWithoutFederatedIdentity
        } = watchedValues;
        routes[route.name]({
          ...filteredParams,
          ...watchedValuesWithoutFederatedIdentity,
        }).replace();
      }

      if (route.name === "conventionImmersionForExternals") {
        const filteredParams = filterParamsForRoute({
          urlParams,
          matchingParams: conventionParams,
          forceExcludeParams: ["fedId", "fedIdProvider"],
        });
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
