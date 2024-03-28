import { DiscussionId, ExchangeRole } from "../discussion/discussion.dto";

export const createOpaqueEmail = (
  discussionId: DiscussionId,
  recipientKind: ExchangeRole,
  replyDomain: string,
) => {
  const recipientLetter = recipientKind === "establishment" ? "e" : "b";

  return `${discussionId}_${recipientLetter}@${replyDomain}`;
};
