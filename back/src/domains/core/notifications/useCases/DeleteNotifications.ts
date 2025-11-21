import { subYears } from "date-fns";
import type { ZodSchemaWithInputMatchingOutput } from "shared";
import z from "zod";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../useCaseBuilder";

export type DeleteNotifications = ReturnType<typeof makeDeleteNotifications>;

export type DeleteNotificationsInputPayload = {
  limit: number;
};
const deleteNotificationsInputPayload: ZodSchemaWithInputMatchingOutput<DeleteNotificationsInputPayload> =
  z.object({
    limit: z.number().int().positive(),
  });

export const makeDeleteNotifications = useCaseBuilder("DeleteNotifications")
  .withInput<DeleteNotificationsInputPayload>(deleteNotificationsInputPayload)
  .withOutput<{ deletedNotifications: number }>()
  .withCurrentUser<void>()
  .withDeps<{
    timeGateway: TimeGateway;
  }>()
  .build(async ({ inputParams, uow, deps }) => {
    const twoYearsAgo = subYears(deps.timeGateway.now(), 2);

    const deletedNotifications =
      await uow.notificationRepository.deleteOldestNotifications({
        limit: inputParams.limit,
        createdAt: { to: twoYearsAgo },
      });

    return { deletedNotifications };
  });
