import { subYears } from "date-fns";
import type { ZodSchemaWithInputMatchingOutput } from "shared";
import z from "zod";
import type { TimeGateway } from "../../time-gateway/ports/TimeGateway";
import { useCaseBuilder } from "../../useCaseBuilder";

export type DeleteEvents = ReturnType<typeof makeDeleteEvents>;

export type DeleteEventsInputPayload = {
  limit: number;
};
const deleteEventsInputPayload: ZodSchemaWithInputMatchingOutput<DeleteEventsInputPayload> =
  z.object({
    limit: z.number().int().positive(),
  });

export const makeDeleteEvents = useCaseBuilder("DeleteEvents")
  .withInput<DeleteEventsInputPayload>(deleteEventsInputPayload)
  .withOutput<{ deletedEvents: number }>()
  .withCurrentUser<void>()
  .withDeps<{
    timeGateway: TimeGateway;
  }>()
  .build(async ({ inputParams, uow, deps }) => {
    const oneYearAgo = subYears(deps.timeGateway.now(), 1);

    const deletedEvents = await uow.outboxRepository.deleteOldestEvents({
      limit: inputParams.limit,
      occuredAt: { to: oneYearAgo },
    });

    return { deletedEvents };
  });
