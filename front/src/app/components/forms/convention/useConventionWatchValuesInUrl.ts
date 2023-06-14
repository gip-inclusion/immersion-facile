import { useEffect } from "react";
import { ConventionParamsInUrl } from "src/app/routes/routeParams/convention";
import { routes, useRoute } from "src/app/routes/routes";

export const useConventionWatchValuesInUrl = (
  watchedValues: ConventionParamsInUrl,
) => {
  const {
    schedule,
    immersionAppellation,
    ...watchedValuesExceptScheduleAndAppellation
  } = watchedValues;

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
  }, [
    ...Object.values(watchedValuesExceptScheduleAndAppellation),
    JSON.stringify(schedule),
    JSON.stringify(immersionAppellation),
  ]);
};
