import type { Url } from "shared-routes";
import type { RawQueryParams } from "../utils/queryParams";
import { queryParamsAsString } from "../utils/queryParams";

export const makeUrlWithQueryParams = <U extends Url>(
  url: U,
  queryParams: RawQueryParams,
): Url => {
  const queryString = queryParamsAsString(queryParams);
  return (queryString ? `${url}?${queryString}` : url) as Url;
};
