import {
  defaultPageInPagination,
  defaultPerPageInApiPagination,
  defaultPerPageInWebPagination,
  maxPerPageInApiPagination,
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

export const getPaginationParamsForApiConsumer = ({
  page,
  perPage,
}:
  | PaginationQueryParams
  | undefined = {}): Required<PaginationQueryParams> => ({
  page: page ?? defaultPageInPagination,
  perPage: Math.min(
    perPage ?? defaultPerPageInApiPagination,
    maxPerPageInApiPagination,
  ),
});
