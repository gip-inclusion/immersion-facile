import {
  ApiConsumer,
  BackOfficeJwtPayload,
  createBackOfficeJwtPayload,
  expectPromiseToFailWithError,
  expectToEqual,
  Role,
} from "shared";
import { generateApiConsumerJwtTestFn } from "../../../_testBuilders/jwtTestHelper";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import {
  ForbiddenError,
  UnauthorizedError,
} from "../../../adapters/primary/helpers/httpErrors";
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

  describe("Right paths", () => {
    it("Adds a new api consumer if not existing", async () => {
      const result = await saveApiConsumer.execute(
        authorizedUnJeuneUneSolutionApiConsumer,
        backOfficeJwtPayload,
      );

      expectToEqual(
        result,
        generateApiConsumerJwtTestFn({
          id: authorizedUnJeuneUneSolutionApiConsumer.id,
        }),
      );
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
          status: "never-published",
          wasQuarantined: false,
        },
      ]);
    });

    it("Updates an existing api consumer", async () => {
      uow.apiConsumerRepository.consumers = [
        authorizedUnJeuneUneSolutionApiConsumer,
      ];

      const updatedConsumer: ApiConsumer = {
        ...authorizedUnJeuneUneSolutionApiConsumer,
        rights: {
          searchEstablishment: {
            kinds: [],
            scope: "no-scope",
          },
          convention: {
            kinds: [],
            scope: {
              agencyKinds: [],
            },
          },
        },
      };

      const result = await saveApiConsumer.execute(
        updatedConsumer,
        backOfficeJwtPayload,
      );

      expectToEqual(result, undefined);
      expectToEqual(uow.apiConsumerRepository.consumers, [updatedConsumer]);
      expectToEqual(uow.outboxRepository.events, [
        {
          id: uuidGenerator.new(),
          occurredAt: timeGateway.now().toISOString(),
          topic: "ApiConsumerSaved",
          payload: { consumerId: authorizedUnJeuneUneSolutionApiConsumer.id },
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
        saveApiConsumer.execute(authorizedUnJeuneUneSolutionApiConsumer),
        new UnauthorizedError(),
      );

      expectToEqual(uow.apiConsumerRepository.consumers, []);
      expectToEqual(uow.outboxRepository.events, []);
    });

    it("ForbiddenError on if provided JWT payload is not a backoffice one", async () => {
      const wrongRole: Role = "beneficiary";
      await expectPromiseToFailWithError(
        saveApiConsumer.execute(authorizedUnJeuneUneSolutionApiConsumer, {
          role: wrongRole as any,
          sub: "123",
        }),
        new ForbiddenError(
          `Provided JWT payload does not have sufficient privileges. Received role: '${wrongRole}'`,
        ),
      );

      expectToEqual(uow.apiConsumerRepository.consumers, []);
      expectToEqual(uow.outboxRepository.events, []);
    });
  });
});
