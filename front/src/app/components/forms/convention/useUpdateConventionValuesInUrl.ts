import { useEffect } from "react";
import { useDebounce } from "react-design-system";
import { objectToDependencyList } from "shared";
import type { ConventionParamsInUrl } from "src/app/routes/routeParams/convention";
import { conventionParams, routes, useRoute } from "src/app/routes/routes";
import {
  cleanParamsValues,
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
        !!route.params.jwt ||
        !!route.params.conventionDraftId
      )
        return;

      const filteredAndCleanedParams = cleanParamsValues(
        filterParamsForRoute({
          urlParams,
          matchingParams: conventionParams,
          forceExcludeParams: ["fedId", "fedIdProvider", "fedIdToken"],
        }),
      );

      if (
        route.name === "conventionImmersion" ||
        route.name === "conventionMiniStage"
      ) {
        const {
          fedId: _,
          fedIdProvider: __,
          fedIdToken: ___,
          ...watchedValuesWithoutFederatedIdentity
        } = watchedValues;

        routes[route.name]({
          ...filteredAndCleanedParams,
          ...cleanParamsValues(watchedValuesWithoutFederatedIdentity),
        }).replace();
      }

      if (route.name === "conventionImmersionForExternals") {
        routes
          .conventionImmersionForExternals({
            ...filteredAndCleanedParams,
            ...cleanParamsValues(watchedValues),
            consumer: route.params.consumer,
          })
          .replace();
      }
    },
    useDebounce(objectToDependencyList(watchedValues)),
  );
};
