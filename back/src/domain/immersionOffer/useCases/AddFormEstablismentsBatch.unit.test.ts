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

  it("Adds two formEstablishments successfully and returns report", async () => {
    const formEstablishmentBatch = createFormEstablishmentBatchDto();

    const report = await addFormEstablishmentBatch.execute(
      formEstablishmentBatch,
    );

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
    expectToEqual(report, {
      numberOfEstablishmentsProcessed: 2,
      numberOfSuccess: 2,
      failures: [],
    });
  });

  it("reports the errors when something goes wrong with an addition", async () => {
    const formEstablishmentBatch = createFormEstablishmentBatchDto();
    const existingFormEstablishment =
      formEstablishmentBatch.formEstablishments[0];
    formEstablishmentRepo.setFormEstablishments([existingFormEstablishment]);

    const report = await addFormEstablishmentBatch.execute(
      formEstablishmentBatch,
    );

    expectToEqual(report, {
      numberOfEstablishmentsProcessed: 2,
      numberOfSuccess: 1,
      failures: [
        {
          errorMessage:
            "Establishment with siret 01234567890123 already exists",
          siret: existingFormEstablishment.siret,
        },
      ],
    });
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
      slug: "l-amie-caline",
      name: formEstablishmentBatch.groupName,
      sirets: [
        formEstablishmentBatch.formEstablishments[0].siret,
        formEstablishmentBatch.formEstablishments[1].siret,
      ],
    });
  });

  it("updates Group if it already exists", async () => {
    const formEstablishmentBatch = createFormEstablishmentBatchDto();
    await establishmentGroupRepository.save({
      slug: "l'amie-caline",
      name: formEstablishmentBatch.groupName,
      sirets: [formEstablishmentBatch.formEstablishments[0].siret],
    });
    await formEstablishmentRepo.setFormEstablishments([
      formEstablishmentBatch.formEstablishments[0],
    ]);
    uuidGenerator.setNextUuids(["event1-id", "event2-id"]);

    const report = await addFormEstablishmentBatch.execute(
      formEstablishmentBatch,
    );

    expectToEqual(report, {
      numberOfEstablishmentsProcessed: 2,
      numberOfSuccess: 1,
      failures: [
        {
          siret: formEstablishmentBatch.formEstablishments[0].siret,
          errorMessage:
            "Establishment with siret 01234567890123 already exists",
        },
      ],
    });

    expect(establishmentGroupRepository.groups).toHaveLength(1);
    expectToEqual(establishmentGroupRepository.groups[0], {
      slug: "l-amie-caline",
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
    groupName: "L'amie caliné",
    formEstablishments: [formEstablishment1, formEstablishment2],
  };
};
