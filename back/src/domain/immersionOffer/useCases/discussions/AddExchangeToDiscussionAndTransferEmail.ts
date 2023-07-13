import { z } from "zod";
import {
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

type BrevoAttachment = {
  Name: string;
  ContentType: string;
  ContentLength: number;
  ContentID: string;
  DownloadToken: string;
};

type BrevoRecipient = {
  Name: string | null;
  Address: string;
};

type BrevoEmailItem = {
  Uuid: string[];
  MessageId: string;
  InReplyTo: string | null;
  From: BrevoRecipient;
  To: BrevoRecipient[];
  Cc: BrevoRecipient[];
  ReplyTo: BrevoRecipient | null;
  SentAtDate: string;
  Subject: string;
  Attachments: BrevoAttachment[];
  RawHtmlBody: string | null;
  RawTextBody: string | null;
};

export type BrevoInboundBody = {
  items: BrevoEmailItem[];
};

const brevoInboundBodySchema: z.Schema<BrevoInboundBody> = z.object({
  items: z.array(
    z.object({
      Uuid: z.array(z.string()),
      MessageId: z.string(),
      InReplyTo: z.string().nullable(),
      From: z.object({
        Name: z.string().nullable(),
        Address: z.string(),
      }),
      To: z.array(
        z.object({
          Name: z.string().nullable(),
          Address: z.string(),
        }),
      ),
      Cc: z.array(
        z.object({
          Name: z.string().nullable(),
          Address: z.string(),
        }),
      ),
      ReplyTo: z
        .object({
          Name: z.string().nullable(),
          Address: z.string(),
        })
        .nullable(),
      SentAtDate: z.string(),
      Subject: z.string(),
      Attachments: z.array(
        z.object({
          Name: z.string(),
          ContentType: z.string(),
          ContentLength: z.number(),
          ContentID: z.string(),
          DownloadToken: z.string(),
        }),
      ),
      RawHtmlBody: z.string().nullable(),
      RawTextBody: z.string().nullable(),
    }),
  ),
});

export class AddExchangeToDiscussionAndTransferEmail extends TransactionalUseCase<BrevoInboundBody> {
  private readonly replyDomain: string;
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    domain: string,
    private readonly notificationGateway: NotificationGateway,
  ) {
    super(uowPerformer);
    this.replyDomain = `reply.${domain}`;
  }

  inputSchema = brevoInboundBodySchema;

  protected async _execute(
    brevoResponse: BrevoInboundBody,
    uow: UnitOfWork,
  ): Promise<void> {
    await Promise.all(
      brevoResponse.items.map((item) => this.processBrevoItem(uow, item)),
    );
  }
  private getBrevoItemAttachmentContent(
    downloadToken: string,
  ): Promise<Buffer> {
    return this.notificationGateway.getAttachmentContent(downloadToken);
  }
  private async processBrevoItem(
    uow: UnitOfWork,
    item: BrevoEmailItem,
  ): Promise<void> {
    const [discussionId, recipientKind] =
      this.getDiscussionParamsFromEmail(item);
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
      subject: item.Subject,
      message: processEmailMessage(item),
      sentAt: new Date(item.SentAtDate),
      recipient: recipientKind,
      sender,
    };

    await uow.discussionAggregateRepository.update(
      addExchangeToDiscussion(discussion, exchange),
    );

    await this.saveNotificationAndRelatedEvent(uow, {
      kind: "email",
      templatedContent: {
        kind: "DISCUSSION_EXCHANGE",
        sender: immersionFacileNoReplyEmailSender,
        params: {
          subject: exchange.subject,
          htmlContent: exchange.message,
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
          email: createOpaqueEmail(discussion.id, sender, this.replyDomain),
          name:
            sender === "establishment"
              ? `${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - ${discussion.businessName}`
              : `${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName}`,
        },
        attachments: await Promise.all(
          item.Attachments.map(async (attachment) => ({
            name: attachment.Name,
            content: (
              await this.getBrevoItemAttachmentContent(attachment.DownloadToken)
            ).toString("base64"),
          })),
        ),
      },
      followedIds: {
        establishmentSiret: discussion.siret,
      },
    });
  }
  private getDiscussionParamsFromEmail(
    email: BrevoEmailItem,
  ): [DiscussionId, ExchangeRole] {
    const recipient = email.To.find((recipent) => {
      const regex = new RegExp(`.*_.*@${this.replyDomain}$`);
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
