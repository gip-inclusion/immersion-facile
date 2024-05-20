import { executeInSequence } from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../UseCase";
import { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";
import { WithNotificationIdAndKind } from "../helpers/Notification";
import { NotificationGateway } from "../ports/NotificationGateway";

const withNotificationIdAndKindArray: z.Schema<WithNotificationIdAndKind[]> =
  z.array(
    z.object({
      id: z.string(),
      kind: z.union([z.literal("email"), z.literal("sms")]),
    }),
  );

// Careful, this use case is transactional,
// but it should only do queries and NEVER write anything to the DB.
export class SendNotificationInBatch extends TransactionalUseCase<
  WithNotificationIdAndKind[]
> {
  protected inputSchema = withNotificationIdAndKindArray;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly notificationGateway: NotificationGateway,
  ) {
    super(uowPerformer);
  }

  protected async _execute(
    notificationIdAndKinds: WithNotificationIdAndKind[],
    uow: UnitOfWork,
  ): Promise<void> {
    const emailNotificationIds = notificationIdAndKinds
      .filter(({ kind }) => kind === "email")
      .map(({ id }) => id);

    const smsNotificationIds = notificationIdAndKinds
      .filter(({ kind }) => kind === "sms")
      .map(({ id }) => id);

    const smsNotifications =
      await uow.notificationRepository.getSmsByIds(smsNotificationIds);

    const emailNotifications =
      await uow.notificationRepository.getEmailsByIds(emailNotificationIds);

    await executeInSequence(smsNotifications, (notification) =>
      this.notificationGateway.sendSms(
        notification.templatedContent,
        notification.id,
      ),
    );

    await executeInSequence(emailNotifications, (notification) =>
      this.notificationGateway.sendEmail(
        notification.templatedContent,
        notification.id,
      ),
    );
  }
}
