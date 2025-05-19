import {
  type BrevoEmailItem,
  type DiscussionEmailParamsWithRecipientKind,
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

  const { discussionId, rawRecipientKind, firstname, lastname } =
    recipientEmailParams;

  if (!["e", "b"].includes(rawRecipientKind))
    throw errors.discussion.badRecipientKindFormat({ kind: rawRecipientKind });

  const recipientKind =
    rawRecipientKind === "e" ? "establishment" : "potentialBeneficiary";

  return {
    discussionId,
    firstname,
    lastname,
    recipientKind,
  };
};
