import {
  type Notification,
  type NotificationErrored,
  errors,
  exhaustiveCheck,
} from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../UseCase";
import type { CreateNewEvent } from "../../events/ports/EventBus";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
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

    try {
      await this.#sendNotification(notification);
    } catch (error: any) {
      const errored: NotificationErrored = {
        occurredAt: this.timeGateway.now().toISOString(),
        httpStatus: error.httpStatus,
        message: error.message,
      };

      await uow.notificationRepository.markErrored({
        notificationId: notification.id,
        notificationKind: notification.kind,
        errored,
      });

      // if (
      //   notification.templatedContent.kind === "DISCUSSION_EXCHANGE" &&
      //   !notification.errored
      // ) {
      //
      //   await uow.outboxRepository.save(
      //     this.createNewEvent({
      //       topic: "DISCUSSION_EXCHANGE_DELIVERY_FAILED",
      //       payload: { notificationId, errored },
      //     }),
      //   );
      // }
      throw error;
    }
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
