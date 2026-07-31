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
    const {
      agencyDepartmentCodes: departmentCodesFilter,
      agencyIds: agencyIdsFilter,
      ...restFilters
    } = filters ?? {};

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
      .filter(
        ({ agency }) =>
          !departmentCodesFilter?.length ||
          departmentCodesFilter.includes(agency.address.departmentCode),
      )
      .map(({ agency }) => agency.id);

    const agencyIds = agencyIdsFilter?.length
      ? agencyIdsUserHasValidRightsOn.filter((id) =>
          agencyIdsFilter.includes(id),
        )
      : agencyIdsUserHasValidRightsOn;

    const paginated = await uow.conventionQueries.getPaginatedConventions({
      ...withSort,
      filters: {
        ...restFilters,
        agencyIds,
        dateEnd: {
          ...restFilters.dateEnd,
          from: shouldUseDefaultDateEndFrom(restFilters.dateEnd?.from, now)
            ? subMonths(
                now,
                defaultMonthsThresholdForConventionsListing,
              ).toISOString()
            : restFilters.dateEnd?.from,
          to: shouldIgnoreDateEndTo(restFilters.dateEnd?.to, now)
            ? undefined
            : restFilters.dateEnd?.to,
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

const agencyRolesWithConventionAccess: AgencyRole[] = [
  "counsellor",
  "validator",
  "agency-admin",
  "agency-viewer",
];

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
