import {
  type ConventionStatus,
  conventionStatuses,
  localization,
} from "shared";
import { z } from "zod/v4";
import type { GetConventionsFilters } from "../../../../../../domains/convention/ports/ConventionQueries";

export type GetConventionsByFiltersQueryParamsV2 = {
  startDateGreater?: Date;
  startDateLessOrEqual?: Date;
  withStatuses?: ConventionStatus[];
};

const conventionStatusSchema = z.enum(conventionStatuses, {
  error: localization.invalidEnum,
});

export const getConventionsByFiltersQueryParamsV2Schema = z
  .object({
    startDateGreater: z.coerce.date().optional(),
    startDateLessOrEqual: z.coerce.date().optional(),
    withStatuses: z
      .array(conventionStatusSchema)
      .optional()
      .or(conventionStatusSchema.optional()),
  })
  .strict();

export const getConventionsByFiltersV2ToDomain = (
  paramsV2: GetConventionsByFiltersQueryParamsV2,
): GetConventionsFilters => paramsV2;
