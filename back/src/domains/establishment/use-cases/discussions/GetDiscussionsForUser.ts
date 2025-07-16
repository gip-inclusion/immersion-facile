import {
  type ConnectedUser,
  type DataWithPagination,
  type DiscussionInList,
  type FlatGetPaginatedDiscussionsParams,
  flatGetPaginatedDiscussionsParamsSchema,
  getPaginationParamsForWeb,
  type OmitFromExistingKeys,
} from "shared";
import { useCaseBuilder } from "../../../core/useCaseBuilder";
import type { GetPaginatedDiscussionsForUserParams } from "../../ports/DiscussionRepository";

export const makeGetDiscussionsForUser = useCaseBuilder("GetDiscussionsForUser")
  .withInput<FlatGetPaginatedDiscussionsParams>(
    flatGetPaginatedDiscussionsParamsSchema,
  )
  .withOutput<DataWithPagination<DiscussionInList>>()
  .withCurrentUser<ConnectedUser>()
  .build(async ({ inputParams, uow, currentUser }) => {
    const getPaginatedDiscussionsParams =
      flatDiscussionQueryParamsToGetPaginatedDiscussionsParams(inputParams);

    return uow.discussionRepository.getPaginatedDiscussionsForUser({
      ...getPaginatedDiscussionsParams,
      userId: currentUser.id,
    });
  });

export const flatDiscussionQueryParamsToGetPaginatedDiscussionsParams = (
  flatParams: FlatGetPaginatedDiscussionsParams,
): OmitFromExistingKeys<GetPaginatedDiscussionsForUserParams, "userId"> => {
  const { page, perPage, orderBy, orderDirection, statuses, search, ...rest } =
    flatParams;

  rest satisfies Record<string, never>;

  const pagination = getPaginationParamsForWeb({
    page,
    perPage,
  });

  const isSearchDefined = search !== undefined && search !== "";

  return {
    ...((statuses || isSearchDefined) && {
      filters: {
        ...(statuses && {
          statuses: Array.isArray(statuses) ? statuses : [statuses],
        }),
        ...(isSearchDefined && { search }),
      },
    }),
    order: {
      by: orderBy || "createdAt",
      direction: orderDirection || "desc",
    },
    pagination,
  };
};
