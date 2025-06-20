import type { DiscussionId, ExchangeRole } from "../discussion/discussion.dto";
import type { Email } from "../email/email.dto";
import { slugify } from "../utils/string";

type OpaqueEmailParams = {
  discussionId: DiscussionId;
  replyDomain: string;
  recipient: {
    kind: ExchangeRole;
    firstname?: string;
    lastname?: string;
  };
};

export const createOpaqueEmail = ({
  discussionId,
  replyDomain,
  recipient,
}: OpaqueEmailParams): Email => {
  const recipientLetter = recipient.kind === "establishment" ? "e" : "b";
  const firstname = recipient.firstname
    ? slugify(recipient.firstname)
    : undefined;
  const lastname = recipient.lastname ? slugify(recipient.lastname) : undefined;
  if (firstname && lastname) {
    return `${firstname}_${lastname}__${discussionId}_${recipientLetter}@${replyDomain}`;
  }
  return `${discussionId}_${recipientLetter}@${replyDomain}`;
};
