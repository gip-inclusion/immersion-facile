import { addMilliseconds, addYears } from "date-fns";
import {
  ApiConsumer,
  InclusionConnectedUserBuilder,
  Role,
  createApiConsumerParamsFromApiConsumer,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { generateApiConsumerJwtTestFn } from "../../../../utils/jwtTestHelper";
import { makeCreateNewEvent } from "../../events/ports/EventBus";
import { CustomTimeGateway } from "../../time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../uuid-generator/adapters/UuidGeneratorImplementations";
import { authorizedUnJeuneUneSolutionApiConsumer } from "../adapters/InMemoryApiConsumerRepository";
import { SaveApiConsumer } from "./SaveApiConsumer";

const backofficeAdminBuilder = new InclusionConnectedUserBuilder()
  .withId("backoffice-admin")
  .withIsAdmin(true);
const icBackofficeAdmin = backofficeAdminBuilder.build();
const backofficeAdmin = backofficeAdminBuilder.buildUser();

const simpleUserBuilder = new InclusionConnectedUserBuilder()
  .withId("simple-user")
  .withIsAdmin(false);
const icSimpleUser = simpleUserBuilder.build();
const simpleUser = simpleUserBuilder.buildUser();

describe("SaveApiConsumer", () => {
  let uow: InMemoryUnitOfWork;
  let saveApiConsumer: SaveApiConsumer;
  let timeGateway: CustomTimeGateway;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    uow.userRepository.users = [backofficeAdmin, simpleUser];
    saveApiConsumer = new SaveApiConsumer(
      new InMemoryUowPerformer(uow),
      makeCreateNewEvent({
        timeGateway,
        uuidGenerator,
      }),
      generateApiConsumerJwtTestFn,
      timeGateway,
    );
  });

  describe("Right paths", () => {
    it("Adds a new api consumer if not existing", async () => {
      const today = new Date("2023-09-22");
      const justAfterToday = addMilliseconds(today, 1);
      timeGateway.setNextDates([today, justAfterToday]);
      const result = await saveApiConsumer.execute(
        createApiConsumerParamsFromApiConsumer(
          authorizedUnJeuneUneSolutionApiConsumer,
        ),
        icBackofficeAdmin,
      );

      expectToEqual(
        result,
        generateApiConsumerJwtTestFn({
          id: authorizedUnJeuneUneSolutionApiConsumer.id,
        }),
      );
      expectToEqual(uow.apiConsumerRepository.consumers, [
        {
          ...authorizedUnJeuneUneSolutionApiConsumer,
          createdAt: today.toISOString(),
        },
      ]);
      expectToEqual(uow.outboxRepository.events, [
        {
          id: uuidGenerator.new(),
          occurredAt: justAfterToday.toISOString(),
          topic: "ApiConsumerSaved",
          payload: {
            consumerId: authorizedUnJeuneUneSolutionApiConsumer.id,
            triggeredBy: {
              kind: "inclusion-connected",
              userId: icBackofficeAdmin.id,
            },
          },
          publications: [],
          status: "never-published",
          wasQuarantined: false,
        },
      ]);
    });

    it("Updates an existing api consumer, except subscriptions", async () => {
      const today = new Date("2023-09-22");
      timeGateway.setNextDates([today]);
      const authorizedApiConsumerWithSubscription: ApiConsumer = {
        ...authorizedUnJeuneUneSolutionApiConsumer,
        rights: {
          ...authorizedUnJeuneUneSolutionApiConsumer.rights,
          convention: {
            kinds: ["SUBSCRIPTION"],
            scope: { agencyIds: ["lala"] },
            subscriptions: [
              {
                subscribedEvent: "convention.updated",
                createdAt: today.toISOString(),
                id: "my-subscription-id",
                callbackUrl: "http://yo.lo",
                callbackHeaders: { authorization: "my-token" },
              },
            ],
          },
        },
        createdAt: today.toISOString(),
        expirationDate: addYears(today, 2).toISOString(),
      };
      uow.apiConsumerRepository.consumers = [
        authorizedApiConsumerWithSubscription,
      ];

      const updatedConsumer: ApiConsumer = {
        ...authorizedApiConsumerWithSubscription,
        description: "ma nouvelle description",
        createdAt: today.toISOString(),
        expirationDate: addYears(today, 3).toISOString(),
        rights: {
          ...authorizedApiConsumerWithSubscription.rights,
          convention: {
            ...authorizedApiConsumerWithSubscription.rights.convention,
            subscriptions: [
              ...authorizedApiConsumerWithSubscription.rights.convention
                .subscriptions,
              {
                id: "bob",
                createdAt: new Date().toISOString(),
                callbackHeaders: { authorization: "yo" },
                callbackUrl: "https://yolo.yo.com",
                subscribedEvent: "convention.updated",
              },
            ],
          },
        },
      };

      const result = await saveApiConsumer.execute(
        updatedConsumer,
        icBackofficeAdmin,
      );

      expectToEqual(result, undefined);
      expectToEqual(uow.apiConsumerRepository.consumers, [
        {
          ...authorizedApiConsumerWithSubscription,
          description: "ma nouvelle description",
          createdAt: today.toISOString(),
          expirationDate: addYears(today, 3).toISOString(),
        },
      ]);
      expectToEqual(uow.outboxRepository.events, [
        {
          id: uuidGenerator.new(),
          occurredAt: today.toISOString(),
          topic: "ApiConsumerSaved",
          payload: {
            consumerId: authorizedApiConsumerWithSubscription.id,
            triggeredBy: {
              kind: "inclusion-connected",
              userId: icBackofficeAdmin.id,
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
    it("UnauthorizedError on without JWT payload", async () => {
      await expectPromiseToFailWithError(
        saveApiConsumer.execute(
          createApiConsumerParamsFromApiConsumer(
            authorizedUnJeuneUneSolutionApiConsumer,
          ),
        ),
        errors.user.unauthorized(),
      );

      expectToEqual(uow.apiConsumerRepository.consumers, []);
      expectToEqual(uow.outboxRepository.events, []);
    });

    it("ForbiddenError on if provided JWT payload is not a backoffice one", async () => {
      const _wrongRole: Role = "beneficiary";
      await expectPromiseToFailWithError(
        saveApiConsumer.execute(
          createApiConsumerParamsFromApiConsumer(
            authorizedUnJeuneUneSolutionApiConsumer,
          ),
          icSimpleUser,
        ),
        errors.user.forbidden({ userId: icSimpleUser.id }),
      );

      expectToEqual(uow.apiConsumerRepository.consumers, []);
      expectToEqual(uow.outboxRepository.events, []);
    });
  });
});
