import {
  DiscussionDto,
  DiscussionId,
  DiscussionReadDto,
  Exchange,
  ExchangeRole,
} from "shared";

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

export const discussionToRead = (
  discussion: DiscussionDto,
): DiscussionReadDto => ({
  ...discussion,
  potentialBeneficiary: {
    firstName: discussion.potentialBeneficiary.firstName,
    lastName: discussion.potentialBeneficiary.lastName,
    resumeLink: discussion.potentialBeneficiary.resumeLink,
  },
  establishmentContact: {
    firstName: discussion.establishmentContact.firstName,
    lastName: discussion.establishmentContact.lastName,
    job: discussion.establishmentContact.job,
    contactMethod: discussion.establishmentContact.contactMethod,
  },
});
