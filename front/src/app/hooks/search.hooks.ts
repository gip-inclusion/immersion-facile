import { useDispatch } from "react-redux";
import { keys } from "shared";
import {
  AcquisitionParams,
  acquisitionParams,
  routes,
  searchParams,
} from "src/app/routes/routes";
import {
  filterParamsForRoute,
  getUrlParameters,
} from "src/app/utils/url.utils";
import {
  SearchPageParams,
  searchSlice,
} from "src/core-logic/domain/search/search.slice";
import { Route } from "type-route";

export const encodedSearchUriParams = [
  "place",
] satisfies (keyof SearchPageParams)[];

export const useSearchUseCase = ({
  name,
}: Route<typeof routes.search | typeof routes.searchDiagoriente>) => {
  const dispatch = useDispatch();
  return (values: SearchPageParams) => {
    const urlParams = getUrlParameters(window.location);
    const appellationCodes = values.appellations?.map(
      (appellation) => appellation.appellationCode,
    );
    dispatch(
      searchSlice.actions.searchRequested({ ...values, appellationCodes }),
    );

    const updatedUrlParams = filterParamsForRoute<Partial<SearchPageParams>>({
      urlParams: {
        ...Object.fromEntries(
          Object.entries(urlParams).filter(([key]) =>
            keys(acquisitionParams).includes(key as keyof AcquisitionParams),
          ),
        ),
        ...values,
      },
      matchingParams: searchParams,
    });
    const updatedUrlParamsWithEncodedUriValues = {
      ...updatedUrlParams,
      ...encodedSearchUriParams.reduce((acc, currentKey) => {
        const value = values[currentKey];
        if (value) {
          acc[currentKey] = encodeURIComponent(value);
        }
        return acc;
      }, updatedUrlParams),
    };
    routes[name](updatedUrlParamsWithEncodedUriValues).replace();
  };
};
