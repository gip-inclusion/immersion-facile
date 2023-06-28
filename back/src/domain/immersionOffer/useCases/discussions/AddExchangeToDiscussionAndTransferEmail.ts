import { z } from "zod";
import { addressDtoToString, ExchangeRole } from "shared";
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

type BrevoEmailHeaders = {
  Received: string;
  "DKIM-Signature": string;
  "X-Google-DKIM-Signature": string;
  "X-Gm-Message-State": string;
  "X-Google-Smtp-Source": string;
  "X-Received": string;
  "MIME-Version": string;
  References: string;
  "In-Reply-To": string;
  From: string;
  Date: string;
  "Message-ID": string;
  Subject: string;
  To: string;
  Cc: string;
  "Content-Type": string;
  Bcc: string;
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
  Headers: BrevoEmailHeaders;
  SpamScore: number;
  ExtractedMarkdownMessage: string;
  ExtractedMarkdownSignature: string | null;
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
    const [discussionId, recipientKind] = getDiscussionParamsFromEmail(
      brevoResponse.items[0],
    );
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
      message: brevoResponse.items[0].RawHtmlBody || "",
      sentAt: new Date(brevoResponse.items[0].SentAtDate),
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
          from: sender,
          establishmentContactFirstName:
            discussion.establishmentContact.firstName,
          establishmentContactLastName:
            discussion.establishmentContact.lastName,
          establishmentName: "TODO get name when migration is done",
          establishmentAddress: addressDtoToString(discussion.address),
          appellationLabel: discussion.appellationCode, // TODO fetch label,
          beneficiaryLastName: discussion.potentialBeneficiary.lastName,
          beneficiaryFirstName: discussion.potentialBeneficiary.firstName,
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
            recipientKind === "establishment" ? "e" : "b"
          }@reply-dev.immersion-facile.beta.gouv.fr`,
          name: `TODO`,
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
