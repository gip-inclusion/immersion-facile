import {
  defaultPageInPagination,
  defaultPerPageInApiPagination,
  defaultPerPageInWebPagination,
  maxPerPageInApiPagination,
  maxPerPageInWebPagination,
  type Pagination,
  type PaginationQueryParams,
} from "./pagination.dto";

export const NUMBER_ITEM_TO_DISPLAY_IN_PAGINATED_PAGE = 10;

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

export const calculateLimitAndOffsetFromPagination = ({
  page,
  perPage,
}: Required<PaginationQueryParams>): { limit: number; offset: number } => ({
  limit: perPage,
  offset: (page - 1) * perPage,
});

export const calculatePaginationResult = ({
  page,
  perPage,
  totalRecords,
}: Required<PaginationQueryParams> & { totalRecords: number }): Pagination => ({
  totalRecords,
  currentPage: page,
  totalPages: Math.max(1, Math.ceil(totalRecords / perPage)), // show at least 1 page if there are no results
  numberPerPage: perPage,
});
