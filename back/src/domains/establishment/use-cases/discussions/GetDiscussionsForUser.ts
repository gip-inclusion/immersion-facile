import {
  type DataWithPagination,
  type DiscussionInList,
  type GetPaginatedDiscussionsParams,
  type InclusionConnectedUser,
  getPaginatedDiscussionsParamsSchema,
  getPaginationParamsForWeb,
} from "shared";
import { createTransactionalUseCase } from "../../../core/UseCase";

export const makeGetDiscussionsForUser = createTransactionalUseCase<
  GetPaginatedDiscussionsParams,
  DataWithPagination<DiscussionInList>,
  InclusionConnectedUser
>(
  {
    inputSchema: getPaginatedDiscussionsParamsSchema,
    name: "GetDiscussionsForUser",
  },
  async ({ inputParams, uow, currentUser }) => {
    const { filters } = inputParams;

    const pagination = getPaginationParamsForWeb(inputParams.pagination);

    return uow.discussionRepository.getPaginatedDiscussionsForUser({
      filters,
      pagination,
      userId: currentUser.id,
    });
  },
);
