import {
  type ConnectedUser,
  type ConventionDto,
  type DataWithPagination,
  type GetConventionsForAgencyUserParams,
  getConventionsForAgencyUserParamsSchema,
  getPaginationParamsForWeb,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";

export const makeGetConventionsForAgencyUser = createTransactionalUseCase<
  GetConventionsForAgencyUserParams,
  DataWithPagination<ConventionDto>,
  ConnectedUser
>(
  {
    inputSchema: getConventionsForAgencyUserParamsSchema,
    name: "GetConventionsForAgencyUser",
  },
  async ({ inputParams, uow, currentUser }) => {
    const { filters, sortBy } = inputParams;

    const pagination = getPaginationParamsForWeb(inputParams.pagination);

    return uow.conventionQueries.getPaginatedConventionsForAgencyUser({
      filters,
      sortBy,
      agencyUserId: currentUser.id,
      pagination,
    });
  },
);
