import {
  type Attachment,
  attachmentSchema,
  type DateString,
  type DiscussionDto,
  type DiscussionExchangeForbiddenParams,
  type DiscussionId,
  discussionIdSchema,
  type Exchange,
  type ExchangeRole,
  errors,
  exchangeRoleSchema,
  type InclusionConnectedUser,
  type UserId,
  zStringMinLength1,
} from "shared";
import { z } from "zod";
import type { CreateNewEvent } from "../../../core/events/ports/EventBus";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

const inputSources = ["dashboard", "inbound-parsing"] as const;

type MessageInputCommonFields = {
  message: string;
  discussionId: DiscussionId;
};

type MessageInputFromDashboard = MessageInputCommonFields & {
  recipientRole: Extract<ExchangeRole, "potentialBeneficiary">;
  attachments: never[];
};

type FullMessageInput = MessageInputCommonFields & {
  recipientRole: ExchangeRole;
  attachments: Attachment[];
  sentAt: DateString;
  subject: string;
};

type InputSource = (typeof inputSources)[number];

export type AddExchangeToDiscussionInput =
  | {
      source: Extract<InputSource, "dashboard">;
      messageInputs: MessageInputFromDashboard[];
    }
  | {
      source: Extract<InputSource, "inbound-parsing">;
      messageInputs: FullMessageInput[];
    };

export type MessageInput =
  AddExchangeToDiscussionInput["messageInputs"][number];

const messageInputCommonFieldsSchema = z.object({
  message: zStringMinLength1,
  discussionId: discussionIdSchema,
});

const messageInputFromDashboardSchema = messageInputCommonFieldsSchema.extend({
  recipientRole: z.literal("potentialBeneficiary"),
  attachments: z.array(z.never()),
});

const inputFromDashboardSchema = z.object({
  source: z.literal("dashboard"),
  messageInputs: z.array(messageInputFromDashboardSchema),
});

const fullMessageInputSchema = messageInputCommonFieldsSchema.extend({
  recipientRole: exchangeRoleSchema,
  attachments: z.array(attachmentSchema),
  sentAt: z.string().datetime(),
  subject: z.string(),
});

const inputFromInboundParsingSchema = z.object({
  source: z.literal("inbound-parsing"),
  messageInputs: z.array(fullMessageInputSchema),
});

export const messageInputSchema = z.discriminatedUnion("source", [
  inputFromInboundParsingSchema,
  inputFromDashboardSchema,
]);

const defaultSubject = "Sans objet";

export class AddExchangeToDiscussion extends TransactionalUseCase<
  AddExchangeToDiscussionInput,
  Exchange | DiscussionExchangeForbiddenParams,
  InclusionConnectedUser | null
> {
  protected inputSchema = messageInputSchema;

  readonly #createNewEvent: CreateNewEvent;
  readonly #timeGateway: TimeGateway;
  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    input: AddExchangeToDiscussionInput,
    uow: UnitOfWork,
    inclusionConnectedUser: InclusionConnectedUser | null,
  ): Promise<Exchange | DiscussionExchangeForbiddenParams> {
    if (input.source === "dashboard" && !inclusionConnectedUser) {
      throw errors.user.unauthorized();
    }
    return await Promise.all(
      input.messageInputs.map((messageInput) =>
        this.#processSendMessage(
          uow,
          input.source,
          messageInput,
          inclusionConnectedUser?.id || null,
        ),
      ),
    ).then((exchanges) => exchanges[0]);
  }

  async #processSendMessage(
    uow: UnitOfWork,
    source: InputSource,
    params: MessageInput,
    userId: UserId | null,
  ): Promise<Exchange | DiscussionExchangeForbiddenParams> {
    const { discussionId, message, recipientRole, attachments } = params;

    const sender =
      recipientRole === "establishment"
        ? "potentialBeneficiary"
        : "establishment";

    const discussion = await uow.discussionRepository.getById(discussionId);
    if (!discussion) throw errors.discussion.notFound({ discussionId });

    if (discussion.status !== "PENDING") {
      const params: DiscussionExchangeForbiddenParams = {
        reason: "discussion_completed",
        sender,
      };

      await this.#saveNotificationAndRelatedEvent(uow, {
        followedIds: {
          userId: userId || undefined,
          establishmentSiret: discussion.siret,
        },
        kind: "email",
        templatedContent: {
          kind: "DISCUSSION_EXCHANGE_FORBIDEN",
          params,
          recipients:
            sender === "establishment"
              ? [
                  discussion.establishmentContact.email,
                  ...discussion.establishmentContact.copyEmails,
                ]
              : [discussion.potentialBeneficiary.email],
        },
      });

      return params;
    }

    const establishment =
      await uow.establishmentAggregateRepository.hasEstablishmentAggregateWithSiret(
        discussion.siret,
      );

    if (!establishment) {
      const params: DiscussionExchangeForbiddenParams = {
        reason: "establishment_missing",
        sender,
      };

      await this.#saveNotificationAndRelatedEvent(uow, {
        followedIds: {
          userId: userId || undefined,
          establishmentSiret: discussion.siret,
        },
        kind: "email",
        templatedContent: {
          kind: "DISCUSSION_EXCHANGE_FORBIDEN",
          params,
          recipients:
            sender === "establishment"
              ? [
                  discussion.establishmentContact.email,
                  ...discussion.establishmentContact.copyEmails,
                ]
              : [discussion.potentialBeneficiary.email],
        },
      });

      return params;
    }

    return this.#addExchangeAndSendEvent(uow, discussion, {
      subject: makeFormattedSubject({
        subject: isFullMessageInput(params) ? params.subject : undefined,
        discussion,
        source,
      }),
      message,
      sentAt: isFullMessageInput(params)
        ? params.sentAt
        : this.#timeGateway.now().toISOString(),
      recipient: recipientRole,
      sender,
      attachments,
    });
  }

  async #addExchangeAndSendEvent(
    uow: UnitOfWork,
    discussion: DiscussionDto,
    exchange: Exchange,
  ): Promise<Exchange> {
    await Promise.all([
      uow.discussionRepository.update({
        ...discussion,
        exchanges: [...discussion.exchanges, exchange],
      }),
      uow.outboxRepository.save(
        this.#createNewEvent({
          topic: "ExchangeAddedToDiscussion",
          payload: { discussionId: discussion.id, siret: discussion.siret },
        }),
      ),
    ]);
    return exchange;
  }
}

const makeFormattedSubject = ({
  subject,
  discussion,
  source,
}: {
  subject?: string;
  discussion: DiscussionDto;
  source: InputSource;
}): string => {
  const hasNoSubject = !subject || subject === "";
  if (source === "dashboard" && hasNoSubject) {
    return `Réponse de ${discussion.businessName} à votre demande d'immersion`;
  }
  return hasNoSubject ? defaultSubject : subject;
};

const isFullMessageInput = (
  messageInput: MessageInput,
): messageInput is FullMessageInput =>
  "sentAt" in messageInput && "subject" in messageInput;
