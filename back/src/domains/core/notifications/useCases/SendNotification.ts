import {
  errors,
  exhaustiveCheck,
  type Notification,
  type NotificationErrored,
} from "shared";
import { match, P } from "ts-pattern";
import { z } from "zod/v4";
import type { CreateNewEvent } from "../../events/ports/EventBus";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { TransactionalUseCase } from "../../UseCase";
import type { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import type { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";
import type { WithNotificationIdAndKind } from "../helpers/Notification";
import type { NotificationGateway } from "../ports/NotificationGateway";

const withNotificationIdAndKind: z.Schema<WithNotificationIdAndKind> = z.object(
  {
    id: z.string(),
    kind: z.union([z.literal("email"), z.literal("sms")]),
  },
);

export class SendNotification extends TransactionalUseCase<WithNotificationIdAndKind> {
  protected inputSchema = withNotificationIdAndKind;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly notificationGateway: NotificationGateway,
    private readonly timeGateway: TimeGateway,
    private readonly createNewEvent: CreateNewEvent,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    { id, kind }: WithNotificationIdAndKind,
    uow: UnitOfWork,
  ): Promise<void> {
    const notification = await uow.notificationRepository.getByIdAndKind(
      id,
      kind,
    );

    if (!notification) throw errors.notification.notFound({ id, kind });

    const result = await this.#sendNotification(notification);

    await match(result)
      .with({ isOk: true }, async ({ messageIds }) => {
        await uow.notificationRepository.updateState({
          notificationId: notification.id,
          notificationKind: notification.kind,
          state: {
            status: "accepted",
            occurredAt: this.timeGateway.now().toISOString(),
            messageIds,
          },
        });
      })
      .with(
        { isOk: false, error: { httpStatus: P.number.gte(500) } },
        async ({ error }) => {
          throw errors.generic.unsupportedStatus({
            status: error.httpStatus,
            body: error.message,
            serviceName: "Brevo",
          });
        },
      )
      .with({ isOk: false }, async ({ error }) => {
        const notificationState: NotificationErrored = {
          status: "errored",
          occurredAt: this.timeGateway.now().toISOString(),
          httpStatus: error.httpStatus,
          message: error.message,
        };

        await uow.notificationRepository.updateState({
          notificationId: notification.id,
          notificationKind: notification.kind,
          state: notificationState,
        });

        if (
          notification.templatedContent.kind === "DISCUSSION_EXCHANGE" &&
          notification.state?.status !== "errored"
        ) {
          await uow.outboxRepository.save(
            this.createNewEvent({
              topic: "DiscussionExchangeDeliveryFailed",
              payload: {
                notificationId: notification.id,
                notificationKind: notification.kind,
                errored: notificationState,
              },
            }),
          );
        }
      })
      .exhaustive();
  }

  #sendNotification(notification: Notification) {
    switch (notification.kind) {
      case "email":
        return this.notificationGateway.sendEmail(
          notification.templatedContent,
          notification.id,
        );
      case "sms":
        return this.notificationGateway.sendSms(
          notification.templatedContent,
          notification.id,
        );
      default:
        return exhaustiveCheck(notification, {
          variableName: "notification",
          throwIfReached: true,
        });
    }
  }
}
