import { errors, exhaustiveCheck } from "shared";
import { z } from "zod";
import { TransactionalUseCase } from "../../UseCase";
import { UnitOfWork } from "../../unit-of-work/ports/UnitOfWork";
import { UnitOfWorkPerformer } from "../../unit-of-work/ports/UnitOfWorkPerformer";
import { WithNotificationIdAndKind } from "../helpers/Notification";
import { NotificationGateway } from "../ports/NotificationGateway";

const withNotificationIdAndKind: z.Schema<WithNotificationIdAndKind> = z.object(
  {
    id: z.string(),
    kind: z.union([z.literal("email"), z.literal("sms")]),
  },
);

// Careful, this use case is transactional,
// but it should only do queries and NEVER write anything to the DB.
export class SendNotification extends TransactionalUseCase<WithNotificationIdAndKind> {
  protected inputSchema = withNotificationIdAndKind;

  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly notificationGateway: NotificationGateway,
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
