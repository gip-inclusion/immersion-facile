import { addYears, subYears } from "date-fns";
import { Clock } from "../../domain/core/ports/Clock";
import { GetApiConsumerById } from "../../domain/core/ports/GetApiConsumerById";

type Deps = {
  clock: Clock;
};

/**
 *
 * It creates a stub that simulates it found a valid Api consumer payload
 */

const authorizedId = "my-authorized-id";
const unauthorizedId = "my-unauthorized-id";
const outdatedId = "my-outdated-id";

export const makeStubGetApiConsumerById =
  ({ clock }: Deps): GetApiConsumerById =>
  async (id) => {
    switch (id) {
      case authorizedId:
        return {
          id: authorizedId,
          consumer: "passeEmploi",
          createdAt: clock.now(),
          expirationDate: addYears(clock.now(), 1),
          isAuthorized: true,
        };

      case unauthorizedId:
        return {
          id: authorizedId,
          consumer: "passeEmploi",
          createdAt: clock.now(),
          expirationDate: addYears(clock.now(), 1),
          isAuthorized: false,
        };

      case outdatedId:
        return {
          id: authorizedId,
          consumer: "passeEmploi",
          createdAt: clock.now(),
          expirationDate: subYears(clock.now(), 1),
          isAuthorized: true,
        };

      default:
        return;
    }
  };
