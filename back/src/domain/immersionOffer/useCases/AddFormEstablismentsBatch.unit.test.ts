import {
  FormEstablishmentBatch,
  FormEstablishmentDto,
  FormEstablishmentDtoBuilder,
} from "shared";
import { AddFormEstablishment } from "./AddFormEstablishment";
import { AddFormEstablishmentBatch } from "./AddFormEstablismentsBatch";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
// import { InMemoryFormEstablishmentRepository } from "../../../adapters/secondary/InMemoryFormEstablishmentRepository";
// import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { StubGetSiret } from "../../../_testBuilders/StubGetSiret";
import { InMemoryFeatureFlagRepository } from "../../../adapters/secondary/InMemoryFeatureFlagRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";

// eslint-disable-next-line @typescript-eslint/no-empty-function
describe("AddFormEstablishmentsBatch Use Case", () => {
  let uow: InMemoryUnitOfWork;
  let addFormEstablishmentBatch: AddFormEstablishmentBatch;
  // let formEstablishmentRepo: InMemoryFormEstablishmentRepository;
  // let outboxRepo: InMemoryOutboxRepository;
  let stubGetSiret: StubGetSiret;
  let uowPerformer: InMemoryUowPerformer;

  beforeEach(() => {
    uow = createInMemoryUow();
    stubGetSiret = new StubGetSiret();
    // formEstablishmentRepo = uow.formEstablishmentRepository;
    // outboxRepo = uow.outboxRepository;
    uow.featureFlagRepository = new InMemoryFeatureFlagRepository({
      enableAdminUi: false,
      enableInseeApi: true,
    });

    uowPerformer = new InMemoryUowPerformer(uow);

    const uuidGenerator = new TestUuidGenerator();
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
      new InMemoryUowPerformer(uow),
      addFormEstablishment,
    );
  });

  it("Add one establishment", async () => {
    const formEstablishment1: FormEstablishmentDto =
      FormEstablishmentDtoBuilder.valid().build();

    const payload: FormEstablishmentBatch = {
      groupName: "Tesla",
      formEstablishments: [formEstablishment1],
    };

    await addFormEstablishmentBatch.execute(payload);

    // TODO check if repo has formEstablishments,
    // TODO check that events are saved
    // TODO check group is created
    expect(false).toBe(false);
  });
});
