import { z } from "zod";
import type { ZodSchemaWithInputMatchingOutput } from "../zodUtils";
import type {
  DataWithPagination,
  Pagination,
  PaginationQueryParams,
} from "./pagination.dto";

const pageQueryParamSchema = z.coerce
  .number()
  .positive()
  .min(1)
  .int() as ZodSchemaWithInputMatchingOutput<number>;
const perPageQueryParamSchema = z.coerce
  .number()
  .positive()
  .min(1)
  .max(5_000)
  .int() as ZodSchemaWithInputMatchingOutput<number>;

export const paginationQueryParamsSchema: ZodSchemaWithInputMatchingOutput<PaginationQueryParams> =
  z.object({
    page: pageQueryParamSchema.optional(),
    perPage: perPageQueryParamSchema.optional(),
  });

export const paginationRequiredQueryParamsSchema: ZodSchemaWithInputMatchingOutput<
  Required<PaginationQueryParams>
> = z.object({
  page: pageQueryParamSchema,
  perPage: perPageQueryParamSchema,
});

const paginationSchema: ZodSchemaWithInputMatchingOutput<Pagination> = z.object(
  {
    totalRecords: z.number(),
    currentPage: z.number(),
    totalPages: z.number(),
    numberPerPage: z.number(),
  },
);

export const createPaginatedSchema = <T>(
  schema: ZodSchemaWithInputMatchingOutput<T>,
): ZodSchemaWithInputMatchingOutput<DataWithPagination<T>> =>
  z.object({
    data: z.array(schema),
    pagination: paginationSchema,
  });
