import {
  type Attachment,
  type DateTimeIsoString,
  type DiscussionDto,
  type DiscussionId,
  type Exchange,
  type ExchangeRole,
  type InclusionConnectedUser,
  attachementSchema,
  dateTimeIsoStringSchema,
  discussionIdSchema,
  errors,
  exchangeRoleSchema,
  zStringMinLength1,
} from "shared";
import { z } from "zod/v4";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { CreateNewEvent } from "../../../core/events/ports/EventBus";
import type { TimeGateway } from "../../../core/time-gateway/ports/TimeGateway";
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
  sentAt: DateTimeIsoString;
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
  attachments: z.array(attachementSchema),
  sentAt: dateTimeIsoStringSchema,
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
  Exchange,
  InclusionConnectedUser | null
> {
  protected inputSchema = messageInputSchema;

  readonly #createNewEvent: CreateNewEvent;
  readonly #timeGateway: TimeGateway;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
    timeGateway: TimeGateway,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
    this.#timeGateway = timeGateway;
  }

  protected async _execute(
    input: AddExchangeToDiscussionInput,
    uow: UnitOfWork,
    inclusionConnectedUser: InclusionConnectedUser | null,
  ): Promise<Exchange> {
    if (input.source === "dashboard" && !inclusionConnectedUser) {
      throw errors.user.unauthorized();
    }
    return await Promise.all(
      input.messageInputs.map((messageInput) =>
        this.#processSendMessage(uow, input.source, messageInput),
      ),
    ).then((exchanges) => exchanges[0]);
  }

  async #processSendMessage(
    uow: UnitOfWork,
    source: InputSource,
    params: MessageInput,
  ): Promise<Exchange> {
    const { discussionId, message, recipientRole, attachments } = params;

    const discussion = await uow.discussionRepository.getById(discussionId);
    if (!discussion) throw errors.discussion.notFound({ discussionId });
    const sender =
      recipientRole === "establishment"
        ? "potentialBeneficiary"
        : "establishment";
    const formattedSubject = makeFormattedSubject({
      subject: isFullMessageInput(params) ? params.subject : undefined,
      discussion,
      source,
    });
    const exchange: Exchange = {
      subject: formattedSubject,
      message,
      sentAt: isFullMessageInput(params)
        ? params.sentAt
        : this.#timeGateway.now().toISOString(),
      recipient: recipientRole,
      sender,
      attachments,
    };
    await uow.discussionRepository.update({
      ...discussion,
      exchanges: [...discussion.exchanges, exchange],
    });
    await uow.outboxRepository.save(
      this.#createNewEvent({
        topic: "ExchangeAddedToDiscussion",
        payload: { discussionId: discussion.id, siret: discussion.siret },
      }),
    );
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
): messageInput is FullMessageInput => {
  return "sentAt" in messageInput && "subject" in messageInput;
};
