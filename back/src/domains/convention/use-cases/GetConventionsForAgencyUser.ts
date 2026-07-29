import { subMonths } from "date-fns";
import {
  type AgencyRole,
  type AgencyUserConventionListDto,
  type ConnectedUser,
  type DataWithPagination,
  type DateString,
  defaultMonthsThresholdForConventionsListing,
  type GetConventionsForAgencyUserParams,
  type GetPaginatedConventionsSortBy,
  getConventionsForAgencyUserParamsSchema,
  getPaginationParamsForWeb,
  type WithSort,
} from "shared";
import { conventionDtosToAgencyUserConventionListDtos } from "../../../utils/convention";
import { getUserWithRights } from "../../connected-users/helpers/userRights.helper";
import type { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../core/useCaseBuilder";

const agencyRolesWithConventionAccess: AgencyRole[] = [
  "counsellor",
  "validator",
  "agency-admin",
  "agency-viewer",
];

export const makeGetConventionsForAgencyUser = useCaseBuilder(
  "GetConventionsForAgencyUser",
)
  .withInput<GetConventionsForAgencyUserParams>(
    getConventionsForAgencyUserParamsSchema,
  )
  .withOutput<DataWithPagination<AgencyUserConventionListDto>>()
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

    const user = await getUserWithRights(uow, currentUser.id);

    const agencyIdsUserHasValidRightsOn = user.agencyRights
      .filter(({ roles }) =>
        roles.some((role) => agencyRolesWithConventionAccess.includes(role)),
      )
      .map(({ agency }) => agency.id);

    const requestedAgencyIds = filters?.agencyIds;
    const agencyIds = requestedAgencyIds?.length
      ? agencyIdsUserHasValidRightsOn.filter((id) =>
          requestedAgencyIds.includes(id),
        )
      : agencyIdsUserHasValidRightsOn;

    const paginated = await uow.conventionQueries.getPaginatedConventions({
      ...withSort,
      filters: {
        ...filters,
        agencyIds,
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
      pagination,
    });

    const data = await conventionDtosToAgencyUserConventionListDtos(
      paginated.data,
      uow,
    );

    return { data, pagination: paginated.pagination };
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
