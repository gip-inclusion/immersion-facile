import { useDispatch } from "react-redux";
import { type GetOffersFlatQueryParams, keys } from "shared";
import {
  type AcquisitionParams,
  acquisitionParams,
  routes,
  searchParams,
} from "src/app/routes/routes";
import {
  filterParamsForRoute,
  getUrlParameters,
} from "src/app/utils/url.utils";
import { searchSlice } from "src/core-logic/domain/search/search.slice";
import type { Route } from "type-route";

export const encodedSearchUriParams = [
  "place",
] satisfies (keyof GetOffersFlatQueryParams)[];

export type SearchRoute = Route<
  typeof routes.search | typeof routes.searchForStudent
>;

const filterUrlsParamsAndUpdateUrl = ({
  values,
  urlParams,
  routeName,
}: {
  values: GetOffersFlatQueryParams;
  urlParams: Record<string, string>;
  routeName: SearchRoute["name"];
}) => {
  const filteredUrlParams = filterParamsForRoute<
    Partial<GetOffersFlatQueryParams>
  >({
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
    triggerSearch: (params: GetOffersFlatQueryParams) => {
      dispatch(searchSlice.actions.getOffersRequested(params));
      filterUrlsParamsAndUpdateUrl({
        values: params,
        urlParams: getUrlParameters(window.location),
        routeName: name,
      });
    },
    changeCurrentPage: (values: GetOffersFlatQueryParams) => {
      filterUrlsParamsAndUpdateUrl({
        values,
        urlParams: getUrlParameters(window.location),
        routeName: name,
      });
    },
  };
};
