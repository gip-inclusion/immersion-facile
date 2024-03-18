import { useDispatch } from "react-redux";
import { routes, searchParams } from "src/app/routes/routes";
import {
  filteredUrlParamsForRoute,
  getUrlParameters,
} from "src/app/utils/url.utils";
import {
  SearchPageParams,
  searchSlice,
} from "src/core-logic/domain/search/search.slice";
import { Route } from "type-route";

export const useSearchUseCase = ({
  name,
}: Route<typeof routes.search | typeof routes.searchDiagoriente>) => {
  const dispatch = useDispatch();
  const urlParams = getUrlParameters(window.location);
  const filteredParams = filteredUrlParamsForRoute(urlParams, searchParams);
  return (values: SearchPageParams) => {
    const appellationCodes = values.appellations?.map(
      (appellation) => appellation.appellationCode,
    );
    dispatch(
      searchSlice.actions.searchRequested({ ...values, appellationCodes }),
    );
    routes[name]({
      ...filteredParams,
      ...values,
    }).replace();
  };
};
