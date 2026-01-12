import {
  ConflictError,
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { makeCreateNewEvent } from "../../events/ports/EventBus";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  ApiConsumerBuilder,
  authorizedUnJeuneUneSolutionApiConsumer,
} from "../adapters/InMemoryApiConsumerRepository";
import { RevokeApiConsumer } from "./RevokeApiConsumer";

const backofficeAdminBuilder = new ConnectedUserBuilder()
  .withId("backoffice-admin")
  .withIsAdmin(true);
const connectedBackofficeAdmin = backofficeAdminBuilder.build();
const backofficeAdmin = backofficeAdminBuilder.buildUser();

const simpleUserBuilder = new ConnectedUserBuilder()
  .withId("simple-user")
  .withIsAdmin(false);
const connectedSimpleUser = simpleUserBuilder.build();
const simpleUser = simpleUserBuilder.buildUser();

describe("RevokeApiConsumer", () => {
  let uow: InMemoryUnitOfWork;
  let revokeApiConsumer: RevokeApiConsumer;
  let timeGateway: CustomTimeGateway;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    uow.userRepository.users = [backofficeAdmin, simpleUser];
    revokeApiConsumer = new RevokeApiConsumer(
      new InMemoryUowPerformer(uow),
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator,
      }),
      timeGateway,
    );
  });

  describe("Right paths", () => {
    it("revokes an existing active api consumer", async () => {
      const now = new Date("2024-01-15T10:00:00.000Z");
      const eventId = "event-id-1111-1111-1111-111111111111";
      timeGateway.setNextDates([now, now]);
      uuidGenerator.setNextUuids([eventId]);

      const apiConsumer = new ApiConsumerBuilder().withRevokedAt(null).build();
      uow.apiConsumerRepository.consumers = [apiConsumer];

      await revokeApiConsumer.execute(apiConsumer.id, connectedBackofficeAdmin);

      expectToEqual(uow.apiConsumerRepository.consumers, [
        {
          ...apiConsumer,
          revokedAt: now.toISOString(),
        },
      ]);

      expectToEqual(uow.outboxRepository.events, [
        {
          id: eventId,
          occurredAt: now.toISOString(),
          topic: "ApiConsumerRevoked",
          payload: {
            consumerId: apiConsumer.id,
            triggeredBy: {
              kind: "connected-user",
              userId: connectedBackofficeAdmin.id,
            },
          },
          publications: [],
          status: "never-published",
          wasQuarantined: false,
        },
      ]);
    });
  });

  describe("Wrong paths", () => {
    it("throws UnauthorizedError without JWT payload", async () => {
      await expectPromiseToFailWithError(
        revokeApiConsumer.execute(authorizedUnJeuneUneSolutionApiConsumer.id),
        errors.user.unauthorized(),
      );

      expectToEqual(uow.outboxRepository.events, []);
    });

    it("throws ForbiddenError if user is not admin", async () => {
      await expectPromiseToFailWithError(
        revokeApiConsumer.execute(
          authorizedUnJeuneUneSolutionApiConsumer.id,
          connectedSimpleUser,
        ),
        errors.user.forbidden({ userId: connectedSimpleUser.id }),
      );

      expectToEqual(uow.outboxRepository.events, []);
    });

    it("throws NotFoundError if consumer does not exist", async () => {
      const nonExistentId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

      await expectPromiseToFailWithError(
        revokeApiConsumer.execute(nonExistentId, connectedBackofficeAdmin),
        errors.apiConsumer.notFound({ id: nonExistentId }),
      );

      expectToEqual(uow.outboxRepository.events, []);
    });

    it("throws ConflictError if consumer is already revoked", async () => {
      const alreadyRevokedConsumer = new ApiConsumerBuilder()
        .withRevokedAt("2024-01-01T00:00:00.000Z")
        .build();
      uow.apiConsumerRepository.consumers = [alreadyRevokedConsumer];

      await expectPromiseToFailWithError(
        revokeApiConsumer.execute(
          alreadyRevokedConsumer.id,
          connectedBackofficeAdmin,
        ),
        new ConflictError(
          `Api consumer with id '${alreadyRevokedConsumer.id}' is already revoked`,
        ),
      );

      expectToEqual(uow.apiConsumerRepository.consumers, [
        alreadyRevokedConsumer,
      ]);
      expectToEqual(uow.outboxRepository.events, []);
    });
  });
});
