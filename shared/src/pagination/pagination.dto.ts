export type PaginationQueryParams = {
  page?: number;
  perPage?: number;
};

export type WithRequiredPagination = { pagination: Required<PaginationQueryParams> };

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

type Sort<T> = {
  by: T;
  order: "asc" | "desc";
};

export type WithSort<T> = {
  sort: Sort<T>;
};

export const defaultPageInPagination = 1;
export const defaultPerPageInApiPagination = 100;

export const defaultPerPageInWebPagination = 20;
export const maxPerPageInWebPagination = 100;

export type Sort<T> = {
  by?: T;
  direction?: "asc" | "desc";
};
