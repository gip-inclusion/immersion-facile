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

const MAX_EMAIL_LOCAL_PART = 64;

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
  const separator = "__";
  const limit =
    MAX_EMAIL_LOCAL_PART -
    `${discussionId}_${recipientLetter}`.length -
    separator.length;
  const fullnameWithSeparator =
    firstname && lastname
      ? makeFullnameWithSeparator(firstname, lastname, separator, limit)
      : "";
  return `${fullnameWithSeparator}${discussionId}_${recipientLetter}@${replyDomain}`;
};

const makeFullnameWithSeparator = (
  firstname: string,
  lastname: string,
  separator: string,
  limit: number,
) => {
  const fullname = `${firstname}_${lastname}`;
  const fullnameTruncated = fullname.slice(0, limit);
  return `${fullnameTruncated}${separator}`;
};
