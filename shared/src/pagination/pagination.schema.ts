import { z } from "zod";
import {
  DataWithPagination,
  Pagination,
  PaginationQueryParams,
} from "./pagination.dto";

export const paginationQueryParamsSchema: z.Schema<PaginationQueryParams> =
  z.object({
    page: z.number().positive().min(1).optional(),
    perPage: z.number().min(1).max(5_000).optional(),
  });

export const paginationRequiredQueryParamsSchema: z.Schema<
  Required<PaginationQueryParams>
> = z.object({
  page: z.number().positive().min(1),
  perPage: z.number().min(1).max(5_000),
});

const paginationSchema: z.Schema<Pagination> = z.object({
  totalRecords: z.number(),
  currentPage: z.number(),
  totalPages: z.number(),
  numberPerPage: z.number(),
});

export const createPaginatedSchema = <T>(
  schema: z.Schema<T>,
): z.Schema<DataWithPagination<T>> =>
  z.object({
    data: z.array(schema),
    pagination: paginationSchema,
  });
