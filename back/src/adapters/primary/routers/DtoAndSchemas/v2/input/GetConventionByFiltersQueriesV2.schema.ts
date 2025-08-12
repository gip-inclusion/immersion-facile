import {
  type ConventionStatus,
  conventionStatuses,
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "shared";
import { z } from "zod";
import type { GetConventionsFilters } from "../../../../../../domains/convention/ports/ConventionQueries";

export type GetConventionsByFiltersQueryParamsV2 = {
  startDateGreater?: Date;
  startDateLessOrEqual?: Date;
  withStatuses?: ConventionStatus[];
};

const conventionStatusSchema = z.enum(conventionStatuses, {
  error: localization.invalidEnum,
});

const zToDate: ZodSchemaWithInputMatchingOutput<Date> = z.coerce.date();

export const getConventionsByFiltersQueryParamsV2Schema = z
  .object({
    startDateGreater: zToDate.optional(),
    startDateLessOrEqual: zToDate.optional(),
    withStatuses: z
      .array(conventionStatusSchema)
      .optional()
      .or(conventionStatusSchema.optional()),
  })
  .strict();

export const getConventionsByFiltersV2ToDomain = (
  paramsV2: GetConventionsByFiltersQueryParamsV2,
): GetConventionsFilters => paramsV2;
