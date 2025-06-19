import {
  type ConventionDto,
  type DataWithPagination,
  type GetConventionsForAgencyUserParams,
  getConventionsForAgencyUserParamsSchema,
  getPaginationParamsForWeb,
  type InclusionConnectedUser,
} from "shared";
import { createTransactionalUseCase } from "../../core/UseCase";

export const makeGetConventionsForAgencyUser = createTransactionalUseCase<
  GetConventionsForAgencyUserParams,
  DataWithPagination<ConventionDto>,
  InclusionConnectedUser
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
