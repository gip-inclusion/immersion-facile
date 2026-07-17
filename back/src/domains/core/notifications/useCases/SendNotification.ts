import {
  errors,
  type Notification,
  type NotificationErrored,
  type ZodSchemaWithInputMatchingOutput,
} from "shared";
import { match, P } from "ts-pattern";
import { z } from "zod";
import type { CreateNewEvent } from "../../events/ports/EventBus";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../useCaseBuilder";
import type { WithNotificationIdAndKind } from "../helpers/Notification";
import type { NotificationGateway } from "../ports/NotificationGateway";

const withNotificationIdAndKind: ZodSchemaWithInputMatchingOutput<WithNotificationIdAndKind> =
  z.object({
    id: z.string(),
    kind: z.union([z.literal("email"), z.literal("sms")]),
  });

export type SendNotification = ReturnType<typeof makeSendNotification>;

type Deps = {
  notificationGateway: NotificationGateway;
  timeGateway: TimeGateway;
  createNewEvent: CreateNewEvent;
};

export const makeSendNotification = useCaseBuilder("SendNotification")
  .withInput(withNotificationIdAndKind)
  .withDeps<Deps>()
  .build(async ({ inputParams: { id, kind }, uow, deps }) => {
    const notification = await uow.notificationRepository.getByIdAndKind(
      id,
      kind,
    );

    if (!notification) throw errors.notification.notFound({ id, kind });

    const result = await sendNotification(
      notification,
      deps.notificationGateway,
    );

    await match(result)
      .with({ isOk: true }, async ({ messageIds }) =>
        uow.notificationRepository.updateState({
          notificationId: notification.id,
          notificationKind: notification.kind,
          state: {
            status: "accepted",
            occurredAt: deps.timeGateway.now().toISOString(),
            messageIds,
          },
        }),
      )
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
          occurredAt: deps.timeGateway.now().toISOString(),
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
            deps.createNewEvent({
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
  });

const sendNotification = async (
  notification: Notification,
  notificationGateway: NotificationGateway,
) =>
  match(notification)
    .with({ kind: "email" }, (notification) =>
      notificationGateway.sendEmail(
        notification.templatedContent,
        notification.id,
      ),
    )
    .with({ kind: "sms" }, (notification) =>
      notificationGateway.sendSms(
        notification.templatedContent,
        notification.id,
      ),
    )
    .exhaustive();
