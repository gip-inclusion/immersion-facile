import {
  defaultValidFormEstablishment,
  expectObjectsToMatch,
  expectToEqual,
  FormEstablishmentBatchDto,
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  makeBooleanFeatureFlag,
} from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryEstablishmentGroupRepository } from "../../../adapters/secondary/immersionOffer/inMemoryEstablishmentGroupRepository";
import { InMemoryFeatureFlagRepository } from "../../../adapters/secondary/InMemoryFeatureFlagRepository";
import { InMemoryFormEstablishmentRepository } from "../../../adapters/secondary/InMemoryFormEstablishmentRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import {
  InMemorySiretGateway,
  TEST_OPEN_ESTABLISHMENT_1,
  TEST_OPEN_ESTABLISHMENT_2,
} from "../../../adapters/secondary/siret/InMemorySiretGateway";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { AddFormEstablishment } from "./AddFormEstablishment";
import { AddFormEstablishmentBatch } from "./AddFormEstablismentsBatch";

const createFormEstablishmentBatchDto = (): FormEstablishmentBatchDto => {
  const formEstablishment1: FormEstablishmentDto =
    FormEstablishmentDtoBuilder.valid()
      .withSiret(TEST_OPEN_ESTABLISHMENT_1.siret)
      .build();

  const formEstablishment2: FormEstablishmentDto =
    FormEstablishmentDtoBuilder.valid()
      .withSiret(TEST_OPEN_ESTABLISHMENT_2.siret)
      .withBusinessName("michelin")
      .build();

  return {
    groupName: "L'amie caliné",
    formEstablishments: [formEstablishment1, formEstablishment2],
  };
};

describe("AddFormEstablishmentsBatch Use Case", () => {
  let uow: InMemoryUnitOfWork;
  let addFormEstablishmentBatch: AddFormEstablishmentBatch;
  let formEstablishmentRepo: InMemoryFormEstablishmentRepository;
  let outboxRepo: InMemoryOutboxRepository;
  let establishmentGroupRepository: InMemoryEstablishmentGroupRepository;
  let siretGateway: InMemorySiretGateway;
  let uowPerformer: InMemoryUowPerformer;
  let uuidGenerator: TestUuidGenerator;

  const formEstablishmentBatch = createFormEstablishmentBatchDto();

  beforeEach(() => {
    uow = createInMemoryUow();
    siretGateway = new InMemorySiretGateway();
    formEstablishmentRepo = uow.formEstablishmentRepository;
    establishmentGroupRepository = uow.establishmentGroupRepository;
    outboxRepo = uow.outboxRepository;
    uow.romeRepository.appellations =
      defaultValidFormEstablishment.appellations;
    uow.featureFlagRepository = new InMemoryFeatureFlagRepository({
      enableInseeApi: makeBooleanFeatureFlag(true),
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
      siretGateway,
    );

    addFormEstablishmentBatch = new AddFormEstablishmentBatch(
      addFormEstablishment,
      uowPerformer,
    );
  });

  it("Adds two formEstablishments successfully and returns report", async () => {
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
            "Establishment with siret 12345678901234 already exists",
          siret: existingFormEstablishment.siret,
        },
      ],
    });
  });

  it("Saves an event with topic : 'FormEstablishmentAdded'", async () => {
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
            "Establishment with siret 12345678901234 already exists",
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
