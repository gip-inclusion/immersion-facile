import {
  defaultPageInPagination,
  defaultPerPageInWebPagination,
  maxPerPageInWebPagination,
  type PaginationQueryParams,
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
