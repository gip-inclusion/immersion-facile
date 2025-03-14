import {
  type PaginationQueryParams,
  defaultPageInPagination,
  defaultPerPageInWebPagination,
  maxPerPageInWebPagination,
} from "./pagination.dto";

export const getPaginationParamsForWeb = ({
  page,
  perPage,
}:
  | PaginationQueryParams
  | undefined = {}): Required<PaginationQueryParams> => ({
  page: page ?? defaultPageInPagination,
  perPage: Math.min(
    perPage ?? defaultPerPageInWebPagination,
    maxPerPageInWebPagination,
  ),
});
