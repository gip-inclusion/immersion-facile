import { addYears } from "date-fns";
import { Clock } from "../../domain/core/ports/Clock";
import { GetApiConsumerById } from "../../domain/core/ports/GetApiConsumerById";

type Deps = {
  clock: Clock;
};

/**
 *
 * It creates a stub that simulates it found a valid Api consumer payload
 */

export const makeStubGetApiConsumerById =
  ({ clock }: Deps): GetApiConsumerById =>
  async (id) => ({
    id,
    consumer: "testConsumer",
    createdAt: clock.now(),
    expirationDate: addYears(clock.now(), 1),
    isAuthorized: true,
  });
