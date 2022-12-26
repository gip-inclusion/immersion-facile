import { addYears, subYears } from "date-fns";
import { ApiConsumerId, ApiConsumer } from "shared";
import { ApiConsumerRepository } from "../../domain/auth/ports/ApiConsumerRepository";

/**
 *
 * It creates a stub that simulates it found a valid Api consumer payload
 */

const authorizedId = "my-authorized-id";
const unauthorizedId = "my-unauthorized-id";
const outdatedId = "my-outdated-id";

const now = new Date();

export class InMemoryApiConsumerRepository implements ApiConsumerRepository {
  async getById(id: ApiConsumerId): Promise<ApiConsumer | undefined> {
    switch (id) {
      case authorizedId:
        return {
          id: authorizedId,
          consumer: "passeEmploi",
          createdAt: now,
          expirationDate: addYears(now, 1),
          isAuthorized: true,
        };

      case unauthorizedId:
        return {
          id: authorizedId,
          consumer: "passeEmploi",
          createdAt: now,
          expirationDate: addYears(now, 1),
          isAuthorized: false,
        };

      case outdatedId:
        return {
          id: authorizedId,
          consumer: "passeEmploi",
          createdAt: subYears(now, 2),
          expirationDate: subYears(now, 1),
          isAuthorized: true,
        };

      default:
        return;
    }
  }
}
