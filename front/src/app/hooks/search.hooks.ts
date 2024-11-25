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

type SearchRoute = Route<
  typeof routes.search | typeof routes.searchDiagoriente
>;

const filterUrlsParamsAndUpdateUrl = ({
  values,
  urlParams,
  routeName,
}: {
  values: SearchPageParams;
  urlParams: Record<string, string>;
  routeName: SearchRoute["name"];
}) => {
  const filteredUrlParams = filterParamsForRoute<Partial<SearchPageParams>>({
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
  const encodedUrlParams = {
    ...filteredUrlParams,
    ...encodedSearchUriParams.reduce((acc, currentKey) => {
      const value = values[currentKey];
      if (value) {
        acc[currentKey] = encodeURIComponent(value);
      }
      return acc;
    }, filteredUrlParams),
  };
  routes[routeName](encodedUrlParams).replace();
};

export const useSearch = ({ name }: SearchRoute) => {
  const dispatch = useDispatch();
  return {
    triggerSearch: (values: SearchPageParams) => {
      const appellationCodes = values.appellations?.map(
        (appellation) => appellation.appellationCode,
      );
      dispatch(
        searchSlice.actions.searchRequested({ ...values, appellationCodes }),
      );
      filterUrlsParamsAndUpdateUrl({
        values,
        urlParams: getUrlParameters(window.location),
        routeName: name,
      });
    },
    changeCurrentPage: (values: SearchPageParams) => {
      filterUrlsParamsAndUpdateUrl({
        values,
        urlParams: getUrlParameters(window.location),
        routeName: name,
      });
    },
  };
};
