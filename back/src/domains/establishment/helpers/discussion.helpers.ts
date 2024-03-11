import { DiscussionDto, DiscussionId, Exchange, ExchangeRole } from "shared";

export const addExchangeToDiscussion = (
  discussion: DiscussionDto,
  newExchange: Exchange,
): DiscussionDto => ({
  ...discussion,
  exchanges: [...discussion.exchanges, newExchange],
});

export const createOpaqueEmail = (
  discussionId: DiscussionId,
  recipientKind: ExchangeRole,
  replyDomain: string,
) => {
  const recipientLetter = recipientKind === "establishment" ? "e" : "b";

  return `${discussionId}_${recipientLetter}@${replyDomain}`;
};
