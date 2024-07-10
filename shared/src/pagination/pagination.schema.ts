import { z } from "zod";
import {
  DataWithPagination,
  Pagination,
  PaginationQueryParams,
} from "./pagination.dto";

const pageQueryParamSchema = z.coerce.number().positive().min(1).int();
const perPageQueryParamSchema = z.coerce
  .number()
  .positive()
  .min(1)
  .max(5_000)
  .int();

export const paginationQueryParamsSchema: z.Schema<PaginationQueryParams> =
  z.object({
    page: pageQueryParamSchema.optional(),
    perPage: perPageQueryParamSchema.optional(),
  });

export const paginationRequiredQueryParamsSchema: z.Schema<
  Required<PaginationQueryParams>
> = z.object({
  page: pageQueryParamSchema,
  perPage: perPageQueryParamSchema,
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
