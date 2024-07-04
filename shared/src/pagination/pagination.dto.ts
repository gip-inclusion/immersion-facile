export type PaginationQueryParams = {
  page?: number;
  perPage?: number;
};

export type Pagination = {
  totalRecords: number;
  currentPage: number;
  totalPages: number;
  numberPerPage: number;
};

export type DataWithPagination<T> = {
  data: T[];
  pagination: Pagination;
};

export const defaultPageInPagination = 1;
export const defaultPerPageInPagination = 100;
