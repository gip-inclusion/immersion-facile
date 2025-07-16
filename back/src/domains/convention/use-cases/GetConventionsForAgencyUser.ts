import {
  type ConnectedUser,
  type ConventionDto,
  type DataWithPagination,
  type GetConventionsForAgencyUserParams,
  getConventionsForAgencyUserParamsSchema,
  getPaginationParamsForWeb,
} from "shared";
import { useCaseBuilder } from "../../core/useCaseBuilder";

export const makeGetConventionsForAgencyUser = useCaseBuilder(
  "GetConventionsForAgencyUser",
)
  .withInput<GetConventionsForAgencyUserParams>(
    getConventionsForAgencyUserParamsSchema,
  )
  .withOutput<DataWithPagination<ConventionDto>>()
  .withCurrentUser<ConnectedUser>()

  .build(async ({ inputParams, uow, currentUser }) => {
    const { filters, sortBy } = inputParams;

    const pagination = getPaginationParamsForWeb(inputParams.pagination);

    return uow.conventionQueries.getPaginatedConventionsForAgencyUser({
      filters,
      sortBy,
      agencyUserId: currentUser.id,
      pagination,
    });
  });
