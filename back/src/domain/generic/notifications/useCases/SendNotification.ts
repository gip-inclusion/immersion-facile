import { z } from "zod";
import { exhaustiveCheck } from "shared";
import { NotFoundError } from "../../../../adapters/primary/helpers/httpErrors";
import {
  UnitOfWork,
  UnitOfWorkPerformer,
} from "../../../core/ports/UnitOfWork";
import { TransactionalUseCase } from "../../../core/UseCase";
import { WithNotificationIdAndKind } from "../entities/Notification";
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
  constructor(
    uowPerformer: UnitOfWorkPerformer,
    private readonly notificationGateway: NotificationGateway,
  ) {
    super(uowPerformer);
  }

  protected inputSchema = withNotificationIdAndKind;

  protected async _execute(
    { id, kind }: WithNotificationIdAndKind,
    uow: UnitOfWork,
  ): Promise<void> {
    const notification = await uow.notificationRepository.getByIdAndKind(
      id,
      kind,
    );

    if (!notification) {
      throw new NotFoundError(
        `Notification with id ${id} and kind ${kind} not found`,
      );
    }

    switch (notification.kind) {
      case "email":
        return this.notificationGateway.sendEmail(
          notification.templatedContent,
        );
      case "sms":
        return this.notificationGateway.sendSms(notification.templatedContent);
      default:
        return exhaustiveCheck(notification, {
          variableName: "notification",
          throwIfReached: true,
        });
    }
  }
}
