import type { DiscussionId, ExchangeRole } from "../discussion/discussion.dto";

type OpaqueEmailParams = {
  discussionId: DiscussionId;
  replyDomain: string;
  recipient: {
    kind: ExchangeRole;
    firstname: string;
    lastname: string;
  };
};

export const createOpaqueEmail = ({
  discussionId,
  replyDomain,
  recipient,
}: OpaqueEmailParams) => {
  const recipientLetter = recipient.kind === "establishment" ? "e" : "b";

  return `${recipient.firstname}_${recipient.lastname}__${discussionId}_${recipientLetter}@${replyDomain}`;
};
