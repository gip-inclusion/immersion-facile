import {
  type Attachment,
  attachmentSchema,
  type ConnectedUser,
  type DateString,
  type DiscussionDto,
  type DiscussionExchangeForbiddenParams,
  type DiscussionId,
  discussionIdSchema,
  type Email,
  type Exchange,
  type ExchangeRole,
  emailSchema,
  errors,
  exchangeRoleSchema,
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

const inputSources = ["dashboard", "email"] as const;

type MessageInputCommonFields = {
  message: string;
  discussionId: DiscussionId;
};

type MessageInputFromDashboard = MessageInputCommonFields & {
  recipientRole: Extract<ExchangeRole, "potentialBeneficiary">;
  attachments: never[];
};

export type MessageInputFromEmail = MessageInputCommonFields & {
  senderEmail: Email;
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
      source: Extract<InputSource, "email">;
      messageInputs: MessageInputFromEmail[];
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
  senderEmail: emailSchema,
  recipientRole: exchangeRoleSchema,
  attachments: z.array(attachmentSchema),
  sentAt: z.string().datetime(),
  subject: z.string(),
});

const inputFromEmailSchema = z.object({
  source: z.literal("email"),
  messageInputs: z.array(fullMessageInputSchema),
});

export const messageInputSchema = z.discriminatedUnion("source", [
  inputFromEmailSchema,
  inputFromDashboardSchema,
]);

const defaultSubject = "Sans objet";

export class AddExchangeToDiscussion extends TransactionalUseCase<
  AddExchangeToDiscussionInput,
  Exchange | DiscussionExchangeForbiddenParams,
  ConnectedUser | null
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
    connectedUser: ConnectedUser | null,
  ): Promise<Exchange | DiscussionExchangeForbiddenParams> {
    if (input.source === "dashboard" && !connectedUser) {
      throw errors.user.unauthorized();
    }
    return await Promise.all(
      input.messageInputs.map((messageInput) =>
        this.#processSendMessage({
          uow,
          input,
          messageInput,
          userId: connectedUser?.id || null,
        }),
      ),
    ).then((exchanges) => exchanges[0]);
  }

  async #processSendMessage({
    uow,
    input,
    messageInput,
    userId,
  }: {
    uow: UnitOfWork;
    input: AddExchangeToDiscussionInput;
    messageInput: MessageInput;
    userId: UserId | null;
  }): Promise<Exchange | DiscussionExchangeForbiddenParams> {
    const sender =
      messageInput.recipientRole === "establishment"
        ? "potentialBeneficiary"
        : "establishment";

    const discussion = await uow.discussionRepository.getById(
      messageInput.discussionId,
    );
    if (!discussion)
      throw errors.discussion.notFound({
        discussionId: messageInput.discussionId,
      });

    const establishment =
      await uow.establishmentAggregateRepository.hasEstablishmentAggregateWithSiret(
        discussion.siret,
      );

    if (!establishment) {
      const params: DiscussionExchangeForbiddenParams = {
        reason: "establishment_missing",
        sender,
      };

      if (input.source === "email" && isFullMessageInput(messageInput))
        await this.#saveNotificationAndRelatedEvent(uow, {
          followedIds: {
            userId: userId || undefined,
            establishmentSiret: discussion.siret,
          },
          kind: "email",
          templatedContent: {
            kind: "DISCUSSION_EXCHANGE_FORBIDDEN",
            params,
            recipients: [
              sender === "establishment"
                ? messageInput.senderEmail
                : discussion.potentialBeneficiary.email,
            ],
          },
        });

      return params;
    }

    if (discussion.status !== "PENDING") {
      const params: DiscussionExchangeForbiddenParams = {
        reason: "discussion_completed",
        sender,
      };

      if (input.source === "email" && isFullMessageInput(messageInput))
        await this.#saveNotificationAndRelatedEvent(uow, {
          followedIds: {
            userId: userId || undefined,
            establishmentSiret: discussion.siret,
          },
          kind: "email",
          templatedContent: {
            kind: "DISCUSSION_EXCHANGE_FORBIDDEN",
            params,
            recipients: [
              sender === "establishment"
                ? messageInput.senderEmail
                : discussion.potentialBeneficiary.email,
            ],
          },
        });

      return params;
    }

    return this.#addExchangeAndSendEvent(uow, discussion, {
      subject: makeFormattedSubject({
        subject: isFullMessageInput(messageInput)
          ? messageInput.subject
          : undefined,
        discussion,
        source: input.source,
      }),
      message: messageInput.message,
      sentAt: isFullMessageInput(messageInput)
        ? messageInput.sentAt
        : this.#timeGateway.now().toISOString(),
      ...(sender === "establishment"
        ? {
            sender,
            email: "",
            firstname: "",
            lastname: "",
          }
        : { sender }),
      attachments: messageInput.attachments,
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
): messageInput is MessageInputFromEmail =>
  "sentAt" in messageInput && "subject" in messageInput;
