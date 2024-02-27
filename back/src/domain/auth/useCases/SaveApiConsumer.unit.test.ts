import { addMilliseconds, addYears } from "date-fns";
import {
  ApiConsumer,
  BackOfficeJwtPayload,
  Role,
  createApiConsumerParamsFromApiConsumer,
  createBackOfficeJwtPayload,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../adapters/primary/config/uowConfig";
import {
  ForbiddenError,
  UnauthorizedError,
} from "../../../adapters/primary/helpers/httpErrors";
import { authorizedUnJeuneUneSolutionApiConsumer } from "../../../adapters/secondary/InMemoryApiConsumerRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { generateApiConsumerJwtTestFn } from "../../../utils/jwtTestHelper";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { SaveApiConsumer } from "./SaveApiConsumer";

describe("SaveApiConsumer", () => {
  let uow: InMemoryUnitOfWork;
  let saveApiConsumer: SaveApiConsumer;
  let timeGateway: CustomTimeGateway;
  let uuidGenerator: TestUuidGenerator;
  let backOfficeJwtPayload: BackOfficeJwtPayload;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    backOfficeJwtPayload = createBackOfficeJwtPayload({
      durationDays: 1,
      now: timeGateway.now(),
    });
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
        backOfficeJwtPayload,
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
          payload: { consumerId: authorizedUnJeuneUneSolutionApiConsumer.id },
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
        backOfficeJwtPayload,
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
          payload: { consumerId: authorizedApiConsumerWithSubscription.id },
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
        new UnauthorizedError(),
      );

      expectToEqual(uow.apiConsumerRepository.consumers, []);
      expectToEqual(uow.outboxRepository.events, []);
    });

    it("ForbiddenError on if provided JWT payload is not a backoffice one", async () => {
      const wrongRole: Role = "beneficiary";
      await expectPromiseToFailWithError(
        saveApiConsumer.execute(
          createApiConsumerParamsFromApiConsumer(
            authorizedUnJeuneUneSolutionApiConsumer,
          ),
          {
            role: wrongRole as BackOfficeJwtPayload["role"],
            sub: "123",
          },
        ),
        new ForbiddenError(
          `Provided JWT payload does not have sufficient privileges. Received role: '${wrongRole}'`,
        ),
      );

      expectToEqual(uow.apiConsumerRepository.consumers, []);
      expectToEqual(uow.outboxRepository.events, []);
    });
  });
});
