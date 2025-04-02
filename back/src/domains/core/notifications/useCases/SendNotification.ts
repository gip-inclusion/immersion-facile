import { BadRequestError, errors, exhaustiveCheck } from "shared";
import { z } from "zod";
import { unwrapOrThrow } from "../../../../utils/resultAsync";
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
        return unwrapOrThrow(
          this.notificationGateway
            .sendEmail(notification.templatedContent, notification.id)
            .mapErr((error) => {
              if (error instanceof BadRequestError) return error;
              return errors.generic.unsupportedStatus({
                status: error.status,
                body: error.message,
              });
            }),
        );
      case "sms": {
        return unwrapOrThrow(
          this.notificationGateway
            .sendSms(notification.templatedContent, notification.id)
            .mapErr((error) =>
              errors.generic.unsupportedStatus({
                status: error.status,
                body: error.message,
              }),
            ),
        );
      }
      default:
        return exhaustiveCheck(notification, {
          variableName: "notification",
          throwIfReached: true,
        });
    }
  }
}
