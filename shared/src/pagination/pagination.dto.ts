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
