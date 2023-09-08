import { z } from "zod";
import { ConventionStatus, conventionStatuses } from "shared";
import { GetConventionsByFiltersQueries } from "../../../../../../domain/convention/ports/ConventionQueries";

export type GetConventionsByFiltersQueryParamsV2 = {
  startDateGreater?: Date;
  startDateLessOrEqual?: Date;
  withStatuses?: ConventionStatus[];
};

export const getConventionsByFiltersQueryParamsV2Schema = z.object({
  startDateGreater: z.date().optional(),
  startDateLessOrEqual: z.date().optional(),
  withStatuses: z.array(z.enum(conventionStatuses)).optional(),
});

export const getConventionsByFiltersV2ToDomain = (
  paramsV2: GetConventionsByFiltersQueryParamsV2,
): GetConventionsByFiltersQueries => paramsV2;
