import { renderContent } from "html-templates/src/components/email";
import {
  type BrevoEmailItem,
  type BrevoInboundBody,
  type DiscussionId,
  type ExchangeRole,
  brevoInboundBodySchema,
  errors,
  immersionFacileContactEmail,
} from "shared";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { CreateNewEvent } from "../../../core/events/ports/EventBus";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

const defaultSubject = "Sans objet";

export class AddExchangeToDiscussion extends TransactionalUseCase<BrevoInboundBody> {
  protected inputSchema = brevoInboundBodySchema;

  readonly #replyDomain: string;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    domain: string,
  ) {
    super(uowPerformer);
    this.#replyDomain = `reply.${domain}`;

    this.#createNewEvent = createNewEvent;
  }

  protected async _execute(
    brevoResponse: BrevoInboundBody,
    uow: UnitOfWork,
  ): Promise<void> {
    await Promise.all(
      brevoResponse.items.map((item) => this.#processBrevoItem(uow, item)),
    );
  }

  #getDiscussionParamsFromEmail(
    email: BrevoEmailItem,
  ): [DiscussionId, ExchangeRole] {
    const recipient = email.To.find((recipent) => {
      const regex = new RegExp(`.*_.*@${this.#replyDomain}$`);
      return recipent.Address?.match(regex);
    });
    if (!recipient)
      throw errors.discussion.badEmailFormat({
        email: email.To.map((recipient) => recipient.Address).join(", "),
      });

    const [id, rawKind] = recipient.Address.split("@")[0].split("_");
    if (!["e", "b"].includes(rawKind))
      throw errors.discussion.badRecipientKindFormat({ kind: rawKind });

    const kind = rawKind === "e" ? "establishment" : "potentialBeneficiary";
    return [id, kind];
  }

  async #processBrevoItem(
    uow: UnitOfWork,
    item: BrevoEmailItem,
  ): Promise<void> {
    const [discussionId, recipientKind] =
      this.#getDiscussionParamsFromEmail(item);
    const discussion = await uow.discussionRepository.getById(discussionId);
    if (!discussion) throw errors.discussion.notFound({ discussionId });

    const sender =
      recipientKind === "establishment"
        ? "potentialBeneficiary"
        : "establishment";

    await uow.discussionRepository.update({
      ...discussion,
      exchanges: [
        ...discussion.exchanges,
        {
          subject: item.Subject || defaultSubject,
          message: processEmailMessage(item),
          sentAt: new Date(item.SentAtDate).toISOString(),
          recipient: recipientKind,
          sender,
          attachments: item.Attachments
            ? item.Attachments.map(({ Name, DownloadToken }) => ({
                name: Name,
                link: DownloadToken,
              }))
            : [],
        },
      ],
    });

    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "ExchangeAddedToDiscussion",
        payload: { discussionId: discussion.id, siret: discussion.siret },
      }),
    );
  }
}

const cleanContactEmailFromMessage = (message: string) =>
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

const processEmailMessage = (item: BrevoEmailItem) => {
  const emailContent =
    item.RawHtmlBody ||
    (item.RawTextBody &&
      renderContent(item.RawTextBody, { wrapInTable: false })) ||
    "Pas de contenu";
  return cleanContactEmailFromMessage(emailContent);
};
