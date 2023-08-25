import {
  ApiConsumer,
  BackOfficeJwtPayload,
  createBackOfficeJwtPayload,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { generateApiConsumerJwtTestFn } from "../../../_testBuilders/jwtTestHelper";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { ForbiddenError } from "../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { authorizedUnJeuneUneSolutionApiConsumer } from "../../../adapters/secondary/InMemoryApiConsumerRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
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
        timeGateway: new CustomTimeGateway(),
        uuidGenerator,
      }),
      generateApiConsumerJwtTestFn,
    );
  });

  describe("right paths", () => {
    it("new api consumer if not existing", async () => {
      const result = await saveApiConsumer.execute(
        authorizedUnJeuneUneSolutionApiConsumer,
        backOfficeJwtPayload,
      );

      expectToEqual(result, {
        jwt: generateApiConsumerJwtTestFn({
          id: authorizedUnJeuneUneSolutionApiConsumer.id,
        }),
      });
      expectToEqual(uow.apiConsumerRepository.consumers, [
        authorizedUnJeuneUneSolutionApiConsumer,
      ]);
      expectToEqual(uow.outboxRepository.events, [
        {
          id: uuidGenerator.new(),
          occurredAt: timeGateway.now().toISOString(),
          topic: "ApiConsumerSaved",
          payload: { consumerId: authorizedUnJeuneUneSolutionApiConsumer.id },
          publications: [],
          wasQuarantined: false,
        },
      ]);
    });

    it("update existing api consumer", async () => {
      uow.apiConsumerRepository.consumers = [
        authorizedUnJeuneUneSolutionApiConsumer,
      ];

      const updatedConsumer: ApiConsumer = {
        ...authorizedUnJeuneUneSolutionApiConsumer,
        isAuthorized: false,
      };

      const result = await saveApiConsumer.execute(
        updatedConsumer,
        backOfficeJwtPayload,
      );

      expectToEqual(result, {
        jwt: generateApiConsumerJwtTestFn({
          id: authorizedUnJeuneUneSolutionApiConsumer.id,
        }),
      });
      expectToEqual(uow.apiConsumerRepository.consumers, [updatedConsumer]);
      expectToEqual(uow.outboxRepository.events, [
        {
          id: uuidGenerator.new(),
          occurredAt: timeGateway.now().toISOString(),
          topic: "ApiConsumerSaved",
          payload: { consumerId: authorizedUnJeuneUneSolutionApiConsumer.id },
          publications: [],
          wasQuarantined: false,
        },
      ]);
    });
  });

  describe("wrong paths", () => {
    it("ForbiddenError on without backoffice payload", async () => {
      await expectPromiseToFailWithError(
        saveApiConsumer.execute(authorizedUnJeuneUneSolutionApiConsumer),
        new ForbiddenError(),
      );

      expectToEqual(uow.apiConsumerRepository.consumers, []);
      expectToEqual(uow.outboxRepository.events, []);
    });
  });
});
