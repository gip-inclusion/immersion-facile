import {
  type BrevoEmailItem,
  type DiscussionEmailParams,
  type DiscussionEmailParamsWithRecipientKind,
  type LegacyDiscussionEmailParams,
  errors,
  makeExchangeEmailSchema,
} from "shared";

export const getDiscussionParamsFromEmail = (
  email: BrevoEmailItem,
  replyDomain: string,
): DiscussionEmailParamsWithRecipientKind => {
  const recipientEmailParams = email.To.filter(
    (brevoRecipient) => !!brevoRecipient.Address,
  )
    .map((brevoRecipient) => {
      const validatedEmail = makeExchangeEmailSchema(replyDomain).safeParse(
        brevoRecipient.Address,
      );
      if (!validatedEmail.success)
        throw errors.discussion.badEmailFormat({
          email: brevoRecipient.Address,
        });

      return validatedEmail.data;
    })
    .at(0);

  if (!recipientEmailParams)
    throw errors.discussion.badEmailFormat({
      email: email.To.map((recipient) => recipient.Address).join(", "),
    });

  const { discussionId, rawRecipientKind } = recipientEmailParams;

  if (!["e", "b"].includes(rawRecipientKind))
    throw errors.discussion.badRecipientKindFormat({ kind: rawRecipientKind });

  const recipientKind =
    rawRecipientKind === "e" ? "establishment" : "potentialBeneficiary";

  return {
    discussionId,
    recipientKind,
    ...(hasDiscussionParamsFirstnameAndLastname(recipientEmailParams)
      ? {
          firstname: recipientEmailParams.firstname,
          lastname: recipientEmailParams.lastname,
        }
      : {}),
  };
};

const hasDiscussionParamsFirstnameAndLastname = (
  recipientEmailParams: DiscussionEmailParams | LegacyDiscussionEmailParams,
): recipientEmailParams is DiscussionEmailParams => {
  return (
    "firstname" in recipientEmailParams && "lastname" in recipientEmailParams
  );
};
