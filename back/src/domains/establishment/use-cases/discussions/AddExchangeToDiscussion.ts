import {
  type Attachment,
  attachmentSchema,
  type BusinessName,
  type ConnectedUser,
  type DateString,
  type DiscussionDto,
  type DiscussionExchangeForbiddenParams,
  type DiscussionExchangeForbiddenReason,
  type DiscussionId,
  discussionIdSchema,
  type Email,
  type Exchange,
  type ExchangeRole,
  type ExchangeSender,
  type ExtractFromExisting,
  emailSchema,
  errors,
  exchangeRoleSchema,
  localization,
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
import type { EstablishmentAggregate } from "../../entities/EstablishmentAggregate";

const inputSources = ["dashboard", "inbound-parsing"] as const;

type MessageInputCommonFields = {
  message: string;
  discussionId: DiscussionId;
};

type MessageInputFromDashboard = MessageInputCommonFields & {
  recipientRole: Extract<ExchangeRole, "potentialBeneficiary">;
  attachments: never[];
};

type MessageInputFromInboundParsing = MessageInputCommonFields & {
  senderEmail: Email;
  recipientRole: ExchangeRole;
  attachments: Attachment[];
  sentAt: DateString;
  subject: string;
};

type InputSource = (typeof inputSources)[number];

type AddExchangeToDiscussionInput =
  | {
      source: ExtractFromExisting<InputSource, "dashboard">;
      messageInputs: MessageInputFromDashboard[];
    }
  | {
      source: ExtractFromExisting<InputSource, "inbound-parsing">;
      messageInputs: MessageInputFromInboundParsing[];
    };

type MessageInput = AddExchangeToDiscussionInput["messageInputs"][number];

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
  sentAt: z.iso.datetime({
    error: localization.invalidDate,
  }),
  subject: z.string(),
});

const inputFromInboundParsingSchema = z.object({
  source: z.literal("inbound-parsing"),
  messageInputs: z.array(fullMessageInputSchema),
});

const messageInputSchema = z.discriminatedUnion("source", [
  inputFromInboundParsingSchema,
  inputFromDashboardSchema,
]);

const defaultSubject = "Sans objet";

type MessageInputFromDashboardWithUserId = MessageInputFromDashboard & {
  userId: UserId;
};

export class AddExchangeToDiscussion extends TransactionalUseCase<
  AddExchangeToDiscussionInput,
  Exchange | DiscussionExchangeForbiddenParams,
  ConnectedUser
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
    { messageInputs, source }: AddExchangeToDiscussionInput,
    uow: UnitOfWork,
    connectedUser?: ConnectedUser,
  ): Promise<Exchange | DiscussionExchangeForbiddenParams> {
    return Promise.all(
      messageInputs.map((messageInput) =>
        this.#processSendMessage({
          uow,
          source,
          messageInput: isMessageInputFromEmail(messageInput)
            ? messageInput
            : makeDashboardMessageWithUserId(messageInput, connectedUser),
        }),
      ),
    ).then((exchanges) => exchanges[0]);
  }

  async #processSendMessage({
    uow,
    source,
    messageInput,
  }: {
    uow: UnitOfWork;
    source: InputSource;
    messageInput:
      | MessageInputFromDashboardWithUserId
      | MessageInputFromInboundParsing;
  }): Promise<Exchange | DiscussionExchangeForbiddenParams> {
    const discussion = await uow.discussionRepository.getById(
      messageInput.discussionId,
    );

    if (!discussion)
      throw errors.discussion.notFound({
        discussionId: messageInput.discussionId,
      });

    const establishment =
      await uow.establishmentAggregateRepository.getEstablishmentAggregateBySiret(
        discussion.siret,
      );

    return !establishment || discussion.status === "REJECTED"
      ? this.#notifyForbidden({
          uow,
          discussion,
          source,
          messageInput,
          establishment,
          reason: !establishment
            ? "establishment_missing"
            : "discussion_completed",
        })
      : this.#onEstablishmentAndDiscussionNotRejected({
          discussion,
          uow,
          establishment,
          source,
          messageInput,
        });
  }

  async #onEstablishmentAndDiscussionNotRejected({
    discussion,
    uow,
    establishment,
    messageInput,
    source,
  }: {
    discussion: DiscussionDto;
    uow: UnitOfWork;
    establishment: EstablishmentAggregate;
    messageInput:
      | MessageInputFromDashboardWithUserId
      | MessageInputFromInboundParsing;
    source: InputSource;
  }) {
    if (
      this.#isUserPotentialBeneficiaryOnDiscussion({
        messageInput,
        discussion,
      })
    ) {
      return this.#addExchangeAndSendEvent({
        uow,
        discussion,
        messageInput,
        exchangeSender: { sender: "potentialBeneficiary" },
        source,
      });
    }

    const user = isMessageInputFromEmail(messageInput)
      ? await uow.userRepository.findByEmail(messageInput.senderEmail)
      : await uow.userRepository.getById(messageInput.userId);

    if (
      user &&
      establishment.userRights.some(
        (userRight) =>
          userRight.userId === user.id &&
          (userRight.role === "establishment-admin" ||
            userRight.role === "establishment-contact"),
      )
    )
      return this.#addExchangeAndSendEvent({
        uow,
        discussion,
        messageInput,
        exchangeSender: {
          sender: "establishment",
          firstname: user.firstName,
          lastname: user.lastName,
          email: user.email,
        },
        source,
      });

    if (isMessageInputFromEmail(messageInput))
      return this.#notifyForbidden({
        uow,
        discussion,
        source,
        messageInput,
        reason: "user_unknown_or_missing_rights_on_establishment",
        establishment,
      });

    throw !user
      ? errors.user.notFound({ userId: messageInput.userId })
      : errors.establishment.notAdminOrContactRight({
          siret: establishment.establishment.siret,
          userId: user.id,
        });
  }

  #isUserPotentialBeneficiaryOnDiscussion({
    messageInput,
    discussion,
  }: {
    messageInput:
      | MessageInputFromDashboardWithUserId
      | MessageInputFromInboundParsing;
    discussion: DiscussionDto;
  }): boolean {
    if (isMessageInputFromEmail(messageInput)) {
      return messageInput.senderEmail === discussion.potentialBeneficiary.email;
    }
    return false;
  }

  async #addExchangeAndSendEvent({
    uow,
    discussion,
    messageInput,
    source,
    exchangeSender,
  }: {
    uow: UnitOfWork;
    discussion: DiscussionDto;
    messageInput:
      | MessageInputFromDashboardWithUserId
      | MessageInputFromInboundParsing;
    source: InputSource;
    exchangeSender: ExchangeSender;
  }): Promise<Exchange> {
    const exchange: Exchange = {
      subject: makeFormattedSubject({
        subject: isMessageInputFromEmail(messageInput)
          ? messageInput.subject
          : undefined,
        businessName: discussion.businessName,
        source,
      }),
      sentAt: isMessageInputFromEmail(messageInput)
        ? messageInput.sentAt
        : this.#timeGateway.now().toISOString(),
      message: messageInput.message,
      attachments: messageInput.attachments,
      ...exchangeSender,
    };

    await Promise.all([
      uow.discussionRepository.update({
        ...discussion,
        updatedAt: this.#timeGateway.now().toISOString(),
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

  async #notifyForbidden({
    uow,
    discussion,
    source,
    messageInput,
    reason,
    establishment,
  }: {
    uow: UnitOfWork;
    discussion: DiscussionDto;
    source: InputSource;
    messageInput: MessageInput;
    reason: DiscussionExchangeForbiddenReason;
    establishment?: EstablishmentAggregate;
  }): Promise<DiscussionExchangeForbiddenParams> {
    const adminUsers = establishment
      ? await uow.userRepository.getByIds(
          establishment.userRights
            .filter((right) => right.role === "establishment-admin")
            .map(({ userId }) => userId),
        )
      : [];

    const params: DiscussionExchangeForbiddenParams = {
      sender:
        messageInput.recipientRole === "establishment"
          ? "potentialBeneficiary"
          : "establishment",
      reason,
      admins: adminUsers.map(({ firstName, lastName, email }) => ({
        firstName,
        lastName,
        email,
      })),
    };

    if (source === "inbound-parsing" && isMessageInputFromEmail(messageInput))
      await this.#saveNotificationAndRelatedEvent(uow, {
        followedIds: {
          establishmentSiret: discussion.siret,
        },
        kind: "email",
        templatedContent: {
          kind: "DISCUSSION_EXCHANGE_FORBIDDEN",
          params,
          recipients: [messageInput.senderEmail],
        },
      });

    return params;
  }
}

const makeFormattedSubject = ({
  subject,
  businessName,
  source,
}: {
  subject?: string;
  businessName: BusinessName;
  source: InputSource;
}): string => {
  const hasNoSubject = !subject || subject === "";
  if (source === "dashboard" && hasNoSubject) {
    return `Réponse de ${businessName} à votre demande d'immersion`;
  }
  return hasNoSubject ? defaultSubject : subject;
};

const isMessageInputFromEmail = (
  messageInput: MessageInput,
): messageInput is MessageInputFromInboundParsing =>
  "sentAt" in messageInput && "subject" in messageInput;

const makeDashboardMessageWithUserId = (
  messageInput: MessageInputFromDashboard,
  connectedUser?: ConnectedUser,
): MessageInputFromDashboardWithUserId => {
  if (!connectedUser) throw errors.user.unauthorized();
  return { ...messageInput, userId: connectedUser.id };
};
