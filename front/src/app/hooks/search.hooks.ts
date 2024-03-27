import { useDispatch } from "react-redux";
import { routes, searchParams } from "src/app/routes/routes";
import {
  filterParamsForRoute,
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
  return (values: SearchPageParams) => {
    const appellationCodes = values.appellations?.map(
      (appellation) => appellation.appellationCode,
    );
    dispatch(
      searchSlice.actions.searchRequested({ ...values, appellationCodes }),
    );
    routes[name](
      filterParamsForRoute(
        {
          ...urlParams,
          ...values,
        },
        searchParams,
      ),
    ).replace();
  };
};
