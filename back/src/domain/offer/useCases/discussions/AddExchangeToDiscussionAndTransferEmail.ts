import {
  BrevoEmailItem,
  BrevoInboundBody,
  brevoInboundBodySchema,
  DiscussionId,
  ExchangeRole,
  immersionFacileContactEmail,
  immersionFacileNoReplyEmailSender,
} from "shared";
import { renderContent } from "html-templates/src/components/email";
import {
  BadRequestError,
  NotFoundError,
} from "../../../../adapters/primary/helpers/httpErrors";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { SaveNotificationAndRelatedEvent } from "../../../generic/notifications/entities/Notification";
import { NotificationGateway } from "../../../generic/notifications/ports/NotificationGateway";
import {
  addExchangeToDiscussion,
  createOpaqueEmail,
  ExchangeEntity,
} from "../../entities/DiscussionAggregate";

const defaultSubject = "Sans objet";

export class AddExchangeToDiscussionAndTransferEmail extends TransactionalUseCase<BrevoInboundBody> {
  protected inputSchema = brevoInboundBodySchema;

  readonly #replyDomain: string;

  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  readonly #notificationGateway: NotificationGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    domain: string,
    notificationGateway: NotificationGateway,
  ) {
    super(uowPerformer);
    this.#replyDomain = `reply.${domain}`;

    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#notificationGateway = notificationGateway;
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
      throw new BadRequestError(
        `Email does not have the right format email to : ${email.To.map(
          (recipient) => recipient.Address,
        ).join(", ")}`,
      );
    const [id, rawKind] = recipient.Address.split("@")[0].split("_");
    if (!["e", "b"].includes(rawKind))
      throw new BadRequestError(
        `Email does not have the right format kind : ${rawKind}`,
      );
    const kind = rawKind === "e" ? "establishment" : "potentialBeneficiary";
    return [id, kind];
  }

  async #processBrevoItem(
    uow: UnitOfWork,
    item: BrevoEmailItem,
  ): Promise<void> {
    const [discussionId, recipientKind] =
      this.#getDiscussionParamsFromEmail(item);
    const discussion = await uow.discussionAggregateRepository.getById(
      discussionId,
    );
    if (!discussion)
      throw new NotFoundError(`Discussion ${discussionId} not found`);

    const sender =
      recipientKind === "establishment"
        ? "potentialBeneficiary"
        : "establishment";

    const exchange: ExchangeEntity = {
      subject: item.Subject || defaultSubject,
      message: processEmailMessage(item),
      sentAt: new Date(item.SentAtDate),
      recipient: recipientKind,
      sender,
    };

    await uow.discussionAggregateRepository.update(
      addExchangeToDiscussion(discussion, exchange),
    );

    const [appellation] =
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodes([
        discussion.appellationCode,
      ]);

    await this.#saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "DISCUSSION_EXCHANGE",
        sender: immersionFacileNoReplyEmailSender,
        params: {
          subject: exchange.subject,
          htmlContent: `<div style="color: #b5b5b5; font-size: 12px">Pour rappel, voici les informations liées à cette mise en relation :
                  <br /><ul>
                  <li>Candidat : ${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName}</li>
                  <li>Métier : ${appellation?.appellationLabel}</li>
                  <li>Entreprise : ${discussion.businessName} - ${discussion.address.streetNumberAndAddress} ${discussion.address.postcode} ${discussion.address.city}</li>
                  </ul><br /></div>
            ${exchange.message}`,
        },
        recipients: [
          recipientKind === "establishment"
            ? discussion.establishmentContact.email
            : discussion.potentialBeneficiary.email,
        ],
        cc:
          recipientKind === "establishment"
            ? discussion.establishmentContact.copyEmails
            : [],
        replyTo: {
          email: createOpaqueEmail(discussion.id, sender, this.#replyDomain),
          name:
            sender === "establishment"
              ? `${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - ${discussion.businessName}`
              : `${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName}`,
        },
        attachments: await Promise.all(
          item.Attachments.map(async (attachment) => ({
            name: attachment.Name,
            content: (
              await this.#notificationGateway.getAttachmentContent(
                attachment.DownloadToken,
              )
            ).toString("base64"),
          })),
        ),
      },
      followedIds: {
        establishmentSiret: discussion.siret,
      },
    });
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
