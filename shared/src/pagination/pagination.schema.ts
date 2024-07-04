import { z } from "zod";
import type { DataWithPagination, Pagination } from "./pagination.dto";

export type PaginationQueryParams = z.infer<typeof paginationQueryParamsSchema>;
export const paginationQueryParamsSchema = z.object({
  page: z.number().positive().min(1).default(1),
  perPage: z.number().min(1).max(5_000).default(100),
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
