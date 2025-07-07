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

const MAX_FULLNAME_LENGTH = 23;

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
  const fullnameWithSeparator =
    firstname && lastname ? makeFullnameWithSeparator(firstname, lastname) : "";
  return `${fullnameWithSeparator}${discussionId}_${recipientLetter}@${replyDomain}`;
};

const makeFullnameWithSeparator = (firstname: string, lastname: string) => {
  const fullname = `${firstname}_${lastname}`;
  const fullnameTruncated = fullname.slice(0, MAX_FULLNAME_LENGTH);
  return `${fullnameTruncated}__`;
};
