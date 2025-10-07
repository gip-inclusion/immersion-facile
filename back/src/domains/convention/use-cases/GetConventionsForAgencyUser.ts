import {
  type ConnectedUser,
  type ConventionReadDto,
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
  .withOutput<DataWithPagination<ConventionReadDto>>()
  .withCurrentUser<ConnectedUser>()

  .build(async ({ inputParams, uow, currentUser }) => {
    const { filters, sort } = inputParams;

    const pagination = getPaginationParamsForWeb(inputParams.pagination);

    return uow.conventionQueries.getPaginatedConventionsForAgencyUser({
      filters,
      sort,
      agencyUserId: currentUser.id,
      pagination,
    });
  });
