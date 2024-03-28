import { DiscussionDto, Exchange } from "shared";

export const addExchangeToDiscussion = (
  discussion: DiscussionDto,
  newExchange: Exchange,
): DiscussionDto => ({
  ...discussion,
  exchanges: [...discussion.exchanges, newExchange],
});
