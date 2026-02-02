import {
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { generateApiConsumerJwtTestFn } from "../../../../utils/jwtTestHelper";
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
import {
  makeRenewApiConsumerKey,
  type RenewApiConsumerKey,
} from "./RenewApiConsumerKey";

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

describe("RenewApiConsumerKey", () => {
  let uow: InMemoryUnitOfWork;
  let renewApiConsumerKey: RenewApiConsumerKey;
  let timeGateway: CustomTimeGateway;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    uow.userRepository.users = [backofficeAdmin, simpleUser];
    renewApiConsumerKey = makeRenewApiConsumerKey({
      uowPerformer: new InMemoryUowPerformer(uow),
      deps: {
        createNewEvent: makeCreateNewEvent({
          timeGateway,
          uuidGenerator,
        }),
        generateApiConsumerJwt: generateApiConsumerJwtTestFn,
        timeGateway,
      },
    });
  });

  describe("Right paths", () => {
    it("renews the key for an existing active api consumer", async () => {
      const originalKeyIssuedAt = "2024-01-01T00:00:00.000Z";
      const now = new Date("2024-01-15T10:00:00.000Z");
      const eventId = "event-id-2222-2222-2222-222222222222";
      timeGateway.setNextDates([now, now]);
      uuidGenerator.setNextUuids([eventId]);

      const apiConsumer = new ApiConsumerBuilder()
        .withRevokedAt(null)
        .withCurrentKeyIssuedAt(originalKeyIssuedAt)
        .build();
      uow.apiConsumerRepository.consumers = [apiConsumer];

      const result = await renewApiConsumerKey.execute(
        apiConsumer.id,
        connectedBackofficeAdmin,
      );

      expectToEqual(
        result,
        generateApiConsumerJwtTestFn({
          id: apiConsumer.id,
          version: 1,
          iat: now.getTime() / 1000,
        }),
      );

      expectToEqual(uow.apiConsumerRepository.consumers, [
        {
          ...apiConsumer,
          currentKeyIssuedAt: now.toISOString(),
        },
      ]);

      expectToEqual(uow.outboxRepository.events, [
        {
          id: eventId,
          occurredAt: now.toISOString(),
          topic: "ApiConsumerKeyRenewed",
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
        renewApiConsumerKey.execute(
          authorizedUnJeuneUneSolutionApiConsumer.id,
          undefined,
        ),
        errors.user.unauthorized(),
      );

      expectToEqual(uow.outboxRepository.events, []);
    });

    it("throws ForbiddenError if user is not admin", async () => {
      await expectPromiseToFailWithError(
        renewApiConsumerKey.execute(
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
        renewApiConsumerKey.execute(nonExistentId, connectedBackofficeAdmin),
        errors.apiConsumer.notFound({ id: nonExistentId }),
      );

      expectToEqual(uow.outboxRepository.events, []);
    });
  });

  describe("Reactivation of revoked consumer", () => {
    it("reactivates a revoked consumer by clearing revokedAt and generating new key", async () => {
      const revokedAt = "2024-01-10T00:00:00.000Z";
      const now = new Date("2024-01-15T10:00:00.000Z");
      const eventId = "event-id-3333-3333-3333-333333333333";
      timeGateway.setNextDates([now, now]);
      uuidGenerator.setNextUuids([eventId]);

      const revokedConsumer = new ApiConsumerBuilder()
        .withRevokedAt(revokedAt)
        .withCurrentKeyIssuedAt("2024-01-01T00:00:00.000Z")
        .build();
      uow.apiConsumerRepository.consumers = [revokedConsumer];

      const result = await renewApiConsumerKey.execute(
        revokedConsumer.id,
        connectedBackofficeAdmin,
      );

      expectToEqual(
        result,
        generateApiConsumerJwtTestFn({
          id: revokedConsumer.id,
          version: 1,
          iat: now.getTime() / 1000,
        }),
      );

      expectToEqual(uow.apiConsumerRepository.consumers, [
        {
          ...revokedConsumer,
          currentKeyIssuedAt: now.toISOString(),
          revokedAt: null,
        },
      ]);

      expectToEqual(uow.outboxRepository.events, [
        {
          id: eventId,
          occurredAt: now.toISOString(),
          topic: "ApiConsumerKeyRenewed",
          payload: {
            consumerId: revokedConsumer.id,
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
});
