import { useEffect } from "react";
import { ConventionDto } from "shared/src/convention/convention.dto";
import { routes, useRoute } from "src/app/routing/routes";

export const useConventionWatchValuesInUrl = (
  watchedValues: Partial<ConventionDto>,
) => {
  const {
    schedule,
    immersionAppellation,
    ...watchedValuesExceptScheduleAndAppellation
  } = watchedValues;

  const route = useRoute();
  useEffect(() => {
    if (route.name !== "convention" || !!route.params.jwt) return;
    routes.convention(watchedValues).replace();
  }, [
    ...Object.values(watchedValuesExceptScheduleAndAppellation),
    JSON.stringify(schedule),
    JSON.stringify(immersionAppellation),
  ]);
};
