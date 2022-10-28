import { useEffect } from "react";
import { routes, useRoute } from "src/app/routing/routes";
import { SearchParams } from "src/core-logic/domain/search/search.slice";

export const useSearchWatchValuesInUrl = (watchedValues: SearchParams) => {
  const route = useRoute();
  useEffect(() => {
    if (route.name !== "search") return;
    routes.search(watchedValues).replace();
  }, [...Object.values(watchedValues)]);
};
