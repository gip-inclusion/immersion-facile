import {
  type ConnectedUser,
  type ConventionReadDto,
  type DataWithPagination,
  type GetConventionsForAgencyUserParams,
  type GetPaginatedConventionsSortBy,
  getConventionsForAgencyUserParamsSchema,
  getPaginationParamsForWeb,
  type WithSort,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export const makeGetConventionsForAgencyUser = useCaseBuilder(
  "GetConventionsForAgencyUser",
)
  .withInput<GetConventionsForAgencyUserParams>(
    getConventionsForAgencyUserParamsSchema,
  )
  .withOutput<DataWithPagination<ConventionReadDto>>()
  .withCurrentUser<ConnectedUser>()

  .build(async ({ inputParams, uow, currentUser }) => {
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

    return uow.conventionQueries.getPaginatedConventionsForAgencyUser({
      ...withSort,
      filters,
      agencyUserId: currentUser.id,
      pagination,
    });
  });
