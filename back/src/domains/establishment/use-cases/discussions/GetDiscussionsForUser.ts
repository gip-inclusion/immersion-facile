import {
  type DataWithPagination,
  type DiscussionInList,
  type FlatGetPaginatedDiscussionsParams,
  type InclusionConnectedUser,
  type OmitFromExistingKeys,
  flatGetPaginatedDiscussionsParamsSchema,
  getPaginationParamsForWeb,
} from "shared";
import { createTransactionalUseCase } from "../../../core/UseCase";
import type { GetPaginatedDiscussionsForUserParams } from "../../ports/DiscussionRepository";

export const makeGetDiscussionsForUser = createTransactionalUseCase<
  FlatGetPaginatedDiscussionsParams,
  DataWithPagination<DiscussionInList>,
  InclusionConnectedUser
>(
  {
    inputSchema: flatGetPaginatedDiscussionsParamsSchema,
    name: "GetDiscussionsForUser",
  },
  async ({ inputParams, uow, currentUser }) => {
    const getPaginatedDiscussionsParams =
      flatDiscussionQueryParamsTogetPaginatedDiscussionsParams(inputParams);

    return uow.discussionRepository.getPaginatedDiscussionsForUser({
      ...getPaginatedDiscussionsParams,
      userId: currentUser.id,
    });
  },
);

export const flatDiscussionQueryParamsTogetPaginatedDiscussionsParams = (
  flatParams: FlatGetPaginatedDiscussionsParams,
): OmitFromExistingKeys<GetPaginatedDiscussionsForUserParams, "userId"> => {
  const { page, perPage, orderBy, orderDirection, statuses, sirets, ...rest } =
    flatParams;

  rest satisfies Record<string, never>;

  const pagination = getPaginationParamsForWeb({
    page,
    perPage,
  });

  return {
    filters: (statuses || sirets) && {
      statuses: statuses && (Array.isArray(statuses) ? statuses : [statuses]),
      sirets: sirets && (Array.isArray(sirets) ? sirets : [sirets]),
    },
    order: {
      by: orderBy || "createdAt",
      direction: orderDirection || "desc",
    },
    pagination,
  };
};
