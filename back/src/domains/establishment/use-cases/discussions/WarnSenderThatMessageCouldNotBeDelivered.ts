import {
  errors,
  type NotificationErrored,
  type NotificationId,
  type NotificationKind,
  notificationErroredSchema,
  notificationIdSchema,
} from "shared";
import { z } from "zod";
import type { SaveNotificationAndRelatedEvent } from "../../../core/notifications/helpers/Notification";
import { createTransactionalUseCase } from "../../../core/UseCase";

export type WarnSenderThatMessageCouldNotBeDeliveredParams = {
  notificationId: NotificationId;
  notificationKind: NotificationKind;
  errored: NotificationErrored;
};

const inputSchema: z.Schema<WarnSenderThatMessageCouldNotBeDeliveredParams> =
  z.object({
    notificationId: notificationIdSchema,
    notificationKind: z.enum(["email", "sms"]),
    errored: notificationErroredSchema,
  });

export const makeWarnSenderThatMessageCouldNotBeDelivered =
  createTransactionalUseCase<
    WarnSenderThatMessageCouldNotBeDeliveredParams,
    void,
    void,
    { saveNotificationAndRelatedEvent: SaveNotificationAndRelatedEvent }
  >(
    { name: "WarnSenderThatMessageCouldNotBeDelivered", inputSchema },
    async ({
      inputParams: { notificationId, notificationKind },
      uow,
      deps: { saveNotificationAndRelatedEvent },
    }) => {
      const notification = await uow.notificationRepository.getByIdAndKind(
        notificationId,
        notificationKind,
      );
      if (!notification)
        throw errors.notification.notFound({
          kind: notificationKind,
          id: notificationId,
        });

      if (notification.kind === "sms")
        throw errors.notification.smsNotSupported();

      if (notification.state?.status !== "errored")
        throw errors.notification.doesNotNeedToBeWarned({ notificationId });

      const errored = notification.state;

      const senderEmail = notification.templatedContent.sender?.email;

      if (!senderEmail)
        throw errors.notification.noSenderEmail({ notificationId });

      await saveNotificationAndRelatedEvent(uow, {
        kind: "email",
        templatedContent: {
          kind: "WARN_DISCUSSION_DELIVERY_FAILED",
          recipients: [senderEmail],
          params: {
            recipientsInEmailInError: notification.templatedContent.recipients,
            errorMessage: `${errored.message} (status: ${errored.httpStatus})`,
          },
        },
        followedIds: notification.followedIds,
      });
    },
  );
