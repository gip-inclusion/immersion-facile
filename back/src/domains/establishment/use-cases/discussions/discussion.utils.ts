import { renderContent } from "html-templates/src/components/email";
import {
  type BrevoEmailItem,
  type DiscussionEmailParams,
  type Email,
  type ExchangeRole,
  errors,
  immersionFacileContactEmail,
  makeExchangeEmailSchema,
  type OmitFromExistingKeys,
} from "shared";

const defaultSubject = "Sans objet";

type DiscussionEmailParamsWithRecipientKind = OmitFromExistingKeys<
  DiscussionEmailParams,
  "rawRecipientKind" | "firstname" | "lastname"
> & {
  recipientRole: ExchangeRole;
};

export const getDiscussionParamsFromEmail = (
  email: Email,
  replyDomain: string,
): DiscussionEmailParamsWithRecipientKind => {
  const validatedEmail = makeExchangeEmailSchema(replyDomain).safeParse(email);
  if (!validatedEmail.success)
    throw errors.discussion.badEmailFormat({
      email,
    });

  const recipientEmailParams = validatedEmail.data;

  const { discussionId, rawRecipientKind } = recipientEmailParams;

  if (!["e", "b"].includes(rawRecipientKind))
    throw errors.discussion.badRecipientKindFormat({ kind: rawRecipientKind });

  return {
    discussionId,
    recipientRole:
      rawRecipientKind === "e" ? "establishment" : "potentialBeneficiary",
  };
};

export const cleanContactEmailFromMessage = (message: string) =>
  message
    .replaceAll(`<${immersionFacileContactEmail}>`, "")
    .replaceAll(
      `&lt;<a href="mailto:${immersionFacileContactEmail}">${immersionFacileContactEmail}</a>&gt;`,
      "",
    )
    .replaceAll(
      `&lt;<a href="mailto:${immersionFacileContactEmail}" target="_blank">${immersionFacileContactEmail}</a>&gt;`,
      "",
    );

export const processInboundParsingEmailMessage = (item: BrevoEmailItem) => {
  const emailContent =
    item.RawHtmlBody ||
    (item.RawTextBody &&
      renderContent(item.RawTextBody, { wrapInTable: false })) ||
    "Pas de contenu";
  return cleanContactEmailFromMessage(emailContent);
};

export const getSubjectFromEmail = (item: BrevoEmailItem) => {
  return item.Subject || defaultSubject;
};
