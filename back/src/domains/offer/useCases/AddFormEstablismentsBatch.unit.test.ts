import {
  FormEstablishmentBatchDto,
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
  GroupOptions,
  defaultValidFormEstablishment,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import { InMemoryFormEstablishmentRepository } from "../../../adapters/secondary/InMemoryFormEstablishmentRepository";
import { InMemoryGroupRepository } from "../../../adapters/secondary/offer/InMemoryGroupRepository";
import {
  InMemorySiretGateway,
  TEST_OPEN_ESTABLISHMENT_1,
  TEST_OPEN_ESTABLISHMENT_2,
} from "../../../adapters/secondary/siret/InMemorySiretGateway";
import { InMemoryOutboxRepository } from "../../core/events/adapters/InMemoryOutboxRepository";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { AddFormEstablishment } from "./AddFormEstablishment";
import { AddFormEstablishmentBatch } from "./AddFormEstablismentsBatch";

const groupOptions: GroupOptions = {
  heroHeader: {
    title: "My title",
    description: "My description",
  },
};

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
    title: groupOptions.heroHeader.title,
    description: groupOptions.heroHeader.description,
    formEstablishments: [formEstablishment1, formEstablishment2],
  };
};

describe("AddFormEstablishmentsBatch Use Case", () => {
  let uow: InMemoryUnitOfWork;
  let addFormEstablishmentBatch: AddFormEstablishmentBatch;
  let formEstablishmentRepo: InMemoryFormEstablishmentRepository;
  let outboxRepo: InMemoryOutboxRepository;
  let groupRepository: InMemoryGroupRepository;
  let siretGateway: InMemorySiretGateway;
  let uowPerformer: InMemoryUowPerformer;
  let uuidGenerator: TestUuidGenerator;

  const formEstablishmentBatch = createFormEstablishmentBatchDto();

  beforeEach(() => {
    uow = createInMemoryUow();
    siretGateway = new InMemorySiretGateway();
    formEstablishmentRepo = uow.formEstablishmentRepository;
    groupRepository = uow.groupRepository;
    outboxRepo = uow.outboxRepository;
    uow.romeRepository.appellations =
      defaultValidFormEstablishment.appellations;

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
      payload: {
        formEstablishment: formEstablishmentBatch.formEstablishments[0],
      },
    });
    expectObjectsToMatch(outboxRepo.events[1], {
      id: "event2-id",
      topic: "FormEstablishmentAdded",
      payload: {
        formEstablishment: formEstablishmentBatch.formEstablishments[1],
      },
    });
  });

  it("creates the establishmentGroup with the sirets of the establishments", async () => {
    uuidGenerator.setNextUuids(["event1-id", "event2-id"]);

    await addFormEstablishmentBatch.execute(formEstablishmentBatch);

    expect(groupRepository.groupEntities).toHaveLength(1);
    expectToEqual(groupRepository.groupEntities[0], {
      slug: "l-amie-caline",
      name: formEstablishmentBatch.groupName,
      sirets: [
        formEstablishmentBatch.formEstablishments[0].siret,
        formEstablishmentBatch.formEstablishments[1].siret,
      ],
      options: groupOptions,
    });
  });

  it("updates Group if it already exists", async () => {
    const slug = "l-amie-caline";
    await groupRepository.save({
      slug,
      name: formEstablishmentBatch.groupName,
      sirets: [formEstablishmentBatch.formEstablishments[0].siret],
      options: groupOptions,
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

    expectToEqual(groupRepository.groupEntities, [
      {
        slug,
        name: formEstablishmentBatch.groupName,
        sirets: [
          formEstablishmentBatch.formEstablishments[0].siret,
          formEstablishmentBatch.formEstablishments[1].siret,
        ],
        options: groupOptions,
      },
    ]);
  });
});
