import {
  type Attachment,
  type DateString,
  type DiscussionId,
  type ExchangeRole,
  type InclusionConnectedUser,
  attachementSchema,
  discussionIdSchema,
  errors,
  exchangeRoleSchema,
  zStringMinLength1,
} from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../../core/UseCase";
import type { CreateNewEvent } from "../../../core/events/ports/EventBus";
import type { UnitOfWork } from "../../../core/unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../../core/unit-of-work/ports/UnitOfWorkPerformer";

type MessageInputCommonFields = {
  message: string;
  discussionId: DiscussionId;
  sentAt: DateString;
  subject: string;
};

type MessageInputFromDashboard = MessageInputCommonFields & {
  recipientRole: Extract<ExchangeRole, "potentialBeneficiary">;
  attachments: never[];
};

type FullMessageInput = MessageInputCommonFields & {
  recipientRole: ExchangeRole;
  attachments: Attachment[];
};

type InputSource = (typeof inputSources)[number];

export type MessageInput = MessageInputFromDashboard | FullMessageInput;

export type AddExchangeToDiscussionInput = {
  source: InputSource;
  messageInputs: MessageInput[];
};

const inputSources = ["dashboard", "inbound-parsing"] as const;

const messageInputCommonFieldsSchema = z.object({
  message: zStringMinLength1,
  discussionId: discussionIdSchema,
  sentAt: z.string().datetime(),
  subject: z.string(),
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
  void,
  InclusionConnectedUser | null
> {
  protected inputSchema = messageInputSchema;

  readonly #createNewEvent: CreateNewEvent;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
    this.#createNewEvent = createNewEvent;
  }

  protected async _execute(
    input: AddExchangeToDiscussionInput,
    uow: UnitOfWork,
    inclusionConnectedUser: InclusionConnectedUser | null,
  ): Promise<void> {
    if (input.source === "dashboard" && !inclusionConnectedUser) {
      throw errors.user.unauthorized();
    }
    await Promise.all(
      input.messageInputs.map((messageInput) => {
        return this.#processSendMessage(uow, {
          ...messageInput,
          recipientRole: messageInput.recipientRole,
          subject: fallbackToDefaultSubject(messageInput.subject),
        });
      }),
    );
  }

  async #processSendMessage(
    uow: UnitOfWork,
    params: FullMessageInput,
  ): Promise<void> {
    const {
      discussionId,
      message,
      recipientRole,
      subject,
      attachments,
      sentAt,
    } = params;

    const discussion = await uow.discussionRepository.getById(discussionId);
    if (!discussion) throw errors.discussion.notFound({ discussionId });
    const sender =
      recipientRole === "establishment"
        ? "potentialBeneficiary"
        : "establishment";
    await uow.discussionRepository.update({
      ...discussion,
      exchanges: [
        ...discussion.exchanges,
        {
          subject,
          message,
          sentAt,
          recipient: recipientRole,
          sender,
          attachments,
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

const fallbackToDefaultSubject = (subject: string) =>
  subject === "" ? defaultSubject : subject;
