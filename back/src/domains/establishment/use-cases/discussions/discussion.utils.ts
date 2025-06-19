import { renderContent } from "html-templates/src/components/email";
import {
  type BrevoEmailItem,
  type DiscussionEmailParams,
  type DiscussionEmailParamsWithRecipientKind,
  type Email,
  errors,
  immersionFacileContactEmail,
  type LegacyDiscussionEmailParams,
  makeExchangeEmailSchema,
} from "shared";

const defaultSubject = "Sans objet";

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
