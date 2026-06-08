import { subMonths } from "date-fns";
import {
  type ConnectedUser,
  type ConventionReadDto,
  type DataWithPagination,
  type DateString,
  defaultMonthsThresholdForConventionsListing,
  type GetConventionsForAgencyUserParams,
  type GetPaginatedConventionsSortBy,
  getConventionsForAgencyUserParamsSchema,
  getPaginationParamsForWeb,
  type WithSort,
} from "shared";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export const makeGetConventionsForAgencyUser = useCaseBuilder(
  "GetConventionsForAgencyUser",
)
  .withInput<GetConventionsForAgencyUserParams>(
    getConventionsForAgencyUserParamsSchema,
  )
  .withOutput<DataWithPagination<ConventionReadDto>>()
  .withCurrentUser<ConnectedUser>()
  .withDeps<{ timeGateway: TimeGateway }>()
  .build(async ({ inputParams, uow, currentUser, deps }) => {
    const { filters, sort } = inputParams;

    const withSort: WithSort<GetPaginatedConventionsSortBy> | null = sort?.by
      ? {
          sort: {
            by: sort.by,
            direction: sort.direction ?? "desc",
          },
        }
      : null;

    const pagination = getPaginationParamsForWeb(inputParams.pagination);

    const now = deps.timeGateway.now();

    return uow.conventionQueries.getPaginatedConventionsForAgencyUser({
      ...withSort,
      filters: {
        ...filters,
        dateEnd: {
          ...filters?.dateEnd,
          from: shouldUseDefaultDateEndFrom(filters?.dateEnd?.from, now)
            ? subMonths(
                now,
                defaultMonthsThresholdForConventionsListing,
              ).toISOString()
            : filters?.dateEnd?.from,
          to: shouldIgnoreDateEndTo(filters?.dateEnd?.to, now)
            ? undefined
            : filters?.dateEnd?.to,
        },
      },
      agencyUserId: currentUser.id,
      pagination,
    });
  });

const shouldUseDefaultDateEndFrom = (
  dateEndFrom: DateString | undefined,
  now: Date,
) =>
  dateEndFrom
    ? new Date(dateEndFrom) <=
      subMonths(now, defaultMonthsThresholdForConventionsListing)
    : true;

const shouldIgnoreDateEndTo = (dateEndTo: DateString | undefined, now: Date) =>
  dateEndTo
    ? new Date(dateEndTo) <=
      subMonths(now, defaultMonthsThresholdForConventionsListing)
    : false;
