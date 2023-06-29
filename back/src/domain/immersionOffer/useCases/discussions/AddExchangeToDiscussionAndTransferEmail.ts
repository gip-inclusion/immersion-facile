import { z } from "zod";
import { ExchangeRole } from "shared";
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
import {
  addExchangeToDiscussion,
  DiscussionId,
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

export type BrevoInboundResponse = {
  items: BrevoEmailItem[];
};

export class AddExchangeToDiscussionAndTransferEmail extends TransactionalUseCase<
  BrevoInboundResponse,
  void
> {
  inputSchema = z.any();
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent, // private readonly timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    brevoResponse: BrevoInboundResponse,
    uow: UnitOfWork,
  ): Promise<void> {
    await Promise.all(
      brevoResponse.items.map((item) => this.processBrevoItem(uow, item)),
    );
  }
  private async processBrevoItem(uow: UnitOfWork, item: BrevoEmailItem) {
    const [discussionId, recipientKind] = getDiscussionParamsFromEmail(item);
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
      message: item.RawHtmlBody || "",
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
          email: `${discussionId}_${
            sender === "establishment" ? "e" : "b"
          }@reply-dev.immersion-facile.beta.gouv.fr`,
          name:
            sender === "establishment"
              ? `${discussion.establishmentContact.firstName} ${discussion.establishmentContact.lastName} - ${discussion.businessName}`
              : `${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName}`,
        },
      },
      followedIds: {
        establishmentSiret: discussion.siret,
      },
    });
  }
}

const getDiscussionParamsFromEmail = (
  email: BrevoEmailItem,
): [DiscussionId, ExchangeRole] => {
  const recipient = email.To.find((recipent) =>
    recipent.Address?.match(/.*_.*@.*immersion-facile.beta.gouv.fr$/),
  );
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
};
