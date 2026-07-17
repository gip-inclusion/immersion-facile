import {
  executeInSequence,
  type ZodSchemaWithInputMatchingOutput,
} from "shared";
import { z } from "zod";
import { useCaseBuilder } from "../../useCaseBuilder";
import type { WithNotificationIdAndKind } from "../helpers/Notification";
import type { NotificationGateway } from "../ports/NotificationGateway";

const withNotificationIdAndKindArray: ZodSchemaWithInputMatchingOutput<
  WithNotificationIdAndKind[]
> = z.array(
  z.object({
    id: z.string(),
    kind: z.union([z.literal("email"), z.literal("sms")]),
  }),
);

// Careful, this use case is transactional,
// but it should only do queries and NEVER write anything to the DB.

export type SendNotificationInBatch = ReturnType<
  typeof makeSendNotificationInBatch
>;

export const makeSendNotificationInBatch = useCaseBuilder(
  "SendNotificationInBatch",
)
  .withInput(withNotificationIdAndKindArray)
  .withDeps<{ notificationGateway: NotificationGateway }>()
  .build(async ({ inputParams, uow, deps }) => {
    const emailNotificationIds = inputParams
      .filter(({ kind }) => kind === "email")
      .map(({ id }) => id);

    const smsNotificationIds = inputParams
      .filter(({ kind }) => kind === "sms")
      .map(({ id }) => id);

    const smsNotifications =
      await uow.notificationRepository.getSmsByIds(smsNotificationIds);

    const emailNotifications =
      await uow.notificationRepository.getEmailsByIds(emailNotificationIds);

    await Promise.all([
      executeInSequence(smsNotifications, (notification) =>
        deps.notificationGateway
          .sendSms(notification.templatedContent, notification.id)
          .then(() => {
            /* do nothing */
          }),
      ),
      executeInSequence(emailNotifications, (notification) =>
        deps.notificationGateway
          .sendEmail(notification.templatedContent, notification.id)
          .then(() => {
            /* do nothing */
          }),
      ),
    ]);
  });
