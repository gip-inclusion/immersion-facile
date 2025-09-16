import { z } from "zod";
import {
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "../zodUtils";
import type {
  DataWithPagination,
  Pagination,
  PaginationQueryParams,
  Sort,
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

export const sortSchema = <T>(
  schema: ZodSchemaWithInputMatchingOutput<T>,
): ZodSchemaWithInputMatchingOutput<Sort<T>> =>
  z.object({
    by: schema.optional(),
    direction: z
      .enum(["asc", "desc"], {
        error: localization.invalidEnum,
      })
      .optional(),
  });
