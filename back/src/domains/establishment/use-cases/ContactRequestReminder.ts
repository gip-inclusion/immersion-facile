import { addDays } from "date-fns";
import {
  DiscussionDto,
  createOpaqueEmail,
  immersionFacileNoReplyEmailSender,
} from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../core/UseCase";
import {
  NotificationContentAndFollowedIds,
  SaveNotificationAndRelatedEvent,
} from "../../core/notifications/helpers/Notification";
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { UnitOfWork } from "../../core/unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../core/unit-of-work/ports/UnitOfWorkPerformer";

export type ContactRequestReminderMode = "3days" | "7days";

const MAX_DISCUSSIONS = 5000;

export class ContactRequestReminder extends TransactionalUseCase<
  ContactRequestReminderMode,
  number
> {
  protected inputSchema = z.enum(["3days", "7days"]);
  readonly #saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent;
  #domain: string;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent,
    private timeGateway: TimeGateway,
    domain: string,
  ) {
    super(uowPerformer);
    this.#saveNotificationAndRelatedEvent = saveNotificationAndRelatedEvent;
    this.#domain = domain;
  }

  public async _execute(
    mode: ContactRequestReminderMode,
    uow: UnitOfWork,
  ): Promise<number> {
    const now = this.timeGateway.now();
    const discussions = await uow.discussionRepository.getDiscussions(
      {
        lastAnsweredByCandidate: {
          from: addDays(now, mode === "3days" ? -4 : -8),
          to: addDays(now, mode === "3days" ? -3 : -7),
        },
      },
      MAX_DISCUSSIONS,
    );

    const maybeNotifications = await Promise.all(
      discussions.map((discussion) =>
        this.#makeNotifications(uow, discussion, mode),
      ),
    );

    const notifications = maybeNotifications.filter(
      (notifications): notifications is NotificationContentAndFollowedIds =>
        notifications !== null,
    );

    await Promise.all(
      notifications.map((notification) =>
        this.#saveNotificationAndRelatedEvent(uow, notification),
      ),
    );

    return notifications.length;
  }

  async #makeNotifications(
    uow: UnitOfWork,
    discussion: DiscussionDto,
    mode: ContactRequestReminderMode,
  ): Promise<NotificationContentAndFollowedIds | null> {
    const appelations =
      await uow.romeRepository.getAppellationAndRomeDtosFromAppellationCodes([
        discussion.appellationCode,
      ]);
    const appelation = appelations.at(0);
    const replyTo = createOpaqueEmail(
      discussion.id,
      "potentialBeneficiary",
      `reply.${this.#domain}`,
    );
    return appelation
      ? ({
          followedIds: { establishmentSiret: discussion.siret },
          kind: "email",
          templatedContent: {
            kind: "ESTABLISHMENT_CONTACT_REQUEST_REMINDER",
            params: {
              appelationLabel: appelation.appellationLabel,
              beneficiaryFirstName: discussion.potentialBeneficiary.firstName,
              beneficiaryLastName: discussion.potentialBeneficiary.lastName,
              beneficiaryReplyToEmail: replyTo,
              domain: this.#domain,
              mode,
            },
            replyTo: {
              email: replyTo,
              name: `${discussion.potentialBeneficiary.firstName} ${discussion.potentialBeneficiary.lastName}`,
            },
            sender: immersionFacileNoReplyEmailSender,
            recipients: [discussion.establishmentContact.email],
          },
        } satisfies NotificationContentAndFollowedIds)
      : null;
  }
}
