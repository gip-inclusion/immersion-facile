import {
  type ApiConsumer,
  type ConventionReadDto,
  conventionStatuses,
  ForbiddenError,
  localization,
  type ZodSchemaWithInputMatchingOutput,
} from "shared";
import { z } from "zod";
import { useCaseBuilder } from "../../core/useCaseBuilder";
import type { GetConventionsFilters } from "../ports/ConventionQueries";

const MAX_CONVENTIONS_RETURNED = 100;

const inputSchema: ZodSchemaWithInputMatchingOutput<GetConventionsFilters> =
  z.object({
    startDateGreater: z.date().optional(),
    startDateLessOrEqual: z.date().optional(),
    withStatuses: z
      .array(
        z.enum(conventionStatuses, {
          error: localization.invalidEnum,
        }),
      )
      .optional(),
  });

export type GetConventionsForApiConsumer = ReturnType<
  typeof makeGetConventionsForApiConsumer
>;

export const makeGetConventionsForApiConsumer = useCaseBuilder(
  "GetConventionsForApiConsumer",
)
  .withInput(inputSchema)
  .withOutput<ConventionReadDto[]>()
  .withCurrentUser<ApiConsumer>()
  .build(async ({ inputParams: filters, uow, currentUser: apiConsumer }) => {
    if (!apiConsumer) throw new ForbiddenError("No api consumer provided");

    return uow.conventionQueries.getConventionsByScope({
      scope: apiConsumer.rights.convention.scope,
      limit: MAX_CONVENTIONS_RETURNED,
      filters,
    });
  });
