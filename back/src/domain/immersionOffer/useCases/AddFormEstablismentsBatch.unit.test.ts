import {
  defaultValidFormEstablishment,
  expectObjectsToMatch,
  expectToEqual,
  FormEstablishmentBatchDto,
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
} from "shared";
import { InMemoryEstablishmentGroupRepository } from "../../../adapters/secondary/immersionOffer/inMemoryEstablishmentGroupRepository";
import { AddFormEstablishment } from "./AddFormEstablishment";
import { AddFormEstablishmentBatch } from "./AddFormEstablismentsBatch";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryFormEstablishmentRepository } from "../../../adapters/secondary/InMemoryFormEstablishmentRepository";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { StubGetSiret } from "../../../_testBuilders/StubGetSiret";
import { InMemoryFeatureFlagRepository } from "../../../adapters/secondary/InMemoryFeatureFlagRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";

describe("AddFormEstablishmentsBatch Use Case", () => {
  let uow: InMemoryUnitOfWork;
  let addFormEstablishmentBatch: AddFormEstablishmentBatch;
  let formEstablishmentRepo: InMemoryFormEstablishmentRepository;
  let outboxRepo: InMemoryOutboxRepository;
  let establishmentGroupRepository: InMemoryEstablishmentGroupRepository;
  let stubGetSiret: StubGetSiret;
  let uowPerformer: InMemoryUowPerformer;
  let uuidGenerator: TestUuidGenerator;

  beforeEach(() => {
    uow = createInMemoryUow();
    stubGetSiret = new StubGetSiret();
    formEstablishmentRepo = uow.formEstablishmentRepository;
    establishmentGroupRepository = uow.establishmentGroupRepository;
    outboxRepo = uow.outboxRepository;
    uow.romeRepository.appellations =
      defaultValidFormEstablishment.appellations;
    uow.featureFlagRepository = new InMemoryFeatureFlagRepository({
      enableAdminUi: false,
      enableInseeApi: true,
    });

    uowPerformer = new InMemoryUowPerformer(uow);

    uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({
      timeGateway: new CustomTimeGateway(),
      uuidGenerator,
    });

    const addFormEstablishment = new AddFormEstablishment(
      uowPerformer,
      createNewEvent,
      stubGetSiret,
    );

    addFormEstablishmentBatch = new AddFormEstablishmentBatch(
      addFormEstablishment,
      uowPerformer,
    );
  });

  it("Adds two formEstablishments", async () => {
    const formEstablishmentBatch = createFormEstablishmentBatchDto();

    await addFormEstablishmentBatch.execute(formEstablishmentBatch);

    const formEstablishmentsInRepo = await formEstablishmentRepo.getAll();
    expect(formEstablishmentsInRepo).toHaveLength(2);
    expectToEqual(
      formEstablishmentsInRepo[0],
      formEstablishmentBatch.formEstablishments[0],
    );
    expectToEqual(
      formEstablishmentsInRepo[1],
      formEstablishmentBatch.formEstablishments[1],
    );
  });

  it("Saves an event with topic : 'FormEstablishmentAdded'", async () => {
    const formEstablishmentBatch = createFormEstablishmentBatchDto();
    uuidGenerator.setNextUuids(["event1-id", "event2-id"]);

    await addFormEstablishmentBatch.execute(formEstablishmentBatch);

    expect(outboxRepo.events).toHaveLength(2);
    expectObjectsToMatch(outboxRepo.events[0], {
      id: "event1-id",
      topic: "FormEstablishmentAdded",
      payload: formEstablishmentBatch.formEstablishments[0],
    });
    expectObjectsToMatch(outboxRepo.events[1], {
      id: "event2-id",
      topic: "FormEstablishmentAdded",
      payload: formEstablishmentBatch.formEstablishments[1],
    });
  });

  it("creates the establishmentGroup with the sirets of the establishments", async () => {
    const formEstablishmentBatch = createFormEstablishmentBatchDto();
    uuidGenerator.setNextUuids(["event1-id", "event2-id"]);

    await addFormEstablishmentBatch.execute(formEstablishmentBatch);

    expect(establishmentGroupRepository.groups).toHaveLength(1);
    expectToEqual(establishmentGroupRepository.groups[0], {
      name: formEstablishmentBatch.groupName,
      sirets: [
        formEstablishmentBatch.formEstablishments[0].siret,
        formEstablishmentBatch.formEstablishments[1].siret,
      ],
    });
  });
});

const createFormEstablishmentBatchDto = (): FormEstablishmentBatchDto => {
  const formEstablishment1: FormEstablishmentDto =
    FormEstablishmentDtoBuilder.valid().build();

  const formEstablishment2: FormEstablishmentDto =
    FormEstablishmentDtoBuilder.valid()
      .withSiret("11112222333344")
      .withBusinessName("michelin")
      .build();

  return {
    groupName: "Tesla",
    formEstablishments: [formEstablishment1, formEstablishment2],
  };
};
