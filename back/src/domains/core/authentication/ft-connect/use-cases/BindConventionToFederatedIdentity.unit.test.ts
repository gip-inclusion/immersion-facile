import {
  authFailed,
  ConventionDtoBuilder,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import type { InMemoryOutboxRepository } from "../../../events/adapters/InMemoryOutboxRepository";
import {
  type CreateNewEvent,
  makeCreateNewEvent,
} from "../../../events/ports/EventBus";
import { CustomTimeGateway } from "../../../time-gateway/adapters/CustomTimeGateway";
import { createInMemoryUow } from "../../../unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import { TestUuidGenerator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import type { InMemoryConventionFranceTravailAdvisorRepository } from "../adapters/InMemoryConventionFranceTravailAdvisorRepository";
import type { FtUserAndAdvisor } from "../dto/FtConnect.dto";
import { BindConventionToFederatedIdentity } from "./BindConventionToFederatedIdentity";

describe("AssociateFtConnectFederatedIdentity", () => {
  let associateFtConnectFederatedIdentity: BindConventionToFederatedIdentity;
  let uowPerformer: InMemoryUowPerformer;
  let conventionFranceTravailAdvisorRepo: InMemoryConventionFranceTravailAdvisorRepository;
  let outboxRepo: InMemoryOutboxRepository;
  let createNewEvent: CreateNewEvent;
  beforeEach(() => {
    const uow = createInMemoryUow();
    conventionFranceTravailAdvisorRepo =
      uow.conventionFranceTravailAdvisorRepository;
    outboxRepo = uow.outboxRepository;
    uowPerformer = new InMemoryUowPerformer(uow);

    const uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({
      timeGateway: new CustomTimeGateway(),
      uuidGenerator,
    });

    associateFtConnectFederatedIdentity = new BindConventionToFederatedIdentity(
      uowPerformer,
      createNewEvent,
    );
  });

  it("should not associate convention if no federatedIdentity is provided", async () => {
    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity(undefined)
      .build();
    const expectedEvent = createNewEvent({
      topic: "FederatedIdentityNotBoundToConvention",
      payload: { convention: conventionDtoFromEvent, triggeredBy: null },
    });
    await associateFtConnectFederatedIdentity.execute({
      convention: conventionDtoFromEvent,
    });

    expectToEqual(
      conventionFranceTravailAdvisorRepo.conventionFranceTravailUsers,
      {},
    );
    expectObjectsToMatch(outboxRepo.events, [expectedEvent]);
  });

  it("authfailed", async () => {
    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity({ provider: "peConnect", token: authFailed })
      .build();

    await associateFtConnectFederatedIdentity.execute({
      convention: conventionDtoFromEvent,
    });

    expectToEqual(
      conventionFranceTravailAdvisorRepo.conventionFranceTravailUsers,
      {},
    );

    const expectedEvent = createNewEvent({
      topic: "FederatedIdentityNotBoundToConvention",
      payload: { convention: conventionDtoFromEvent, triggeredBy: null },
    });
    expectObjectsToMatch(outboxRepo.events, [expectedEvent]);
  });

  it("should associate convention and federated identity if the federated identity match format", async () => {
    conventionFranceTravailAdvisorRepo.saveFtUserAndAdvisor(userAdvisorDto);
    expectToEqual(
      conventionFranceTravailAdvisorRepo.conventionFranceTravailUsers,
      {},
    );

    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity({ provider: "peConnect", token: userFtExternalId })
      .build();

    await associateFtConnectFederatedIdentity.execute({
      convention: conventionDtoFromEvent,
    });

    expectToEqual(
      conventionFranceTravailAdvisorRepo.conventionFranceTravailUsers,
      {
        [conventionId]: userFtExternalId,
      },
    );
  });

  it("should save event FtConnectFederatedIdentityAssociated", async () => {
    conventionFranceTravailAdvisorRepo.saveFtUserAndAdvisor(userAdvisorDto);
    expectToEqual(
      conventionFranceTravailAdvisorRepo.conventionFranceTravailUsers,
      {},
    );

    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity({ provider: "peConnect", token: userFtExternalId })
      .build();

    await associateFtConnectFederatedIdentity.execute({
      convention: conventionDtoFromEvent,
    });

    expectToEqual(
      conventionFranceTravailAdvisorRepo.conventionFranceTravailUsers,
      {
        [conventionId]: userFtExternalId,
      },
    );

    // outbox rep
    expect(outboxRepo.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepo.events[0], {
      topic: "FederatedIdentityBoundToConvention",
      payload: { convention: conventionDtoFromEvent, triggeredBy: null },
    });
  });
});

const conventionId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";
const userFtExternalId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";
const userAdvisorDto: FtUserAndAdvisor = {
  advisor: {
    email: "elsa.oldenburg@pole-emploi.net",
    firstName: "Elsa",
    lastName: "Oldenburg",
    type: "CAPEMPLOI",
  },
  user: {
    peExternalId: userFtExternalId,
    email: "",
    firstName: "",
    isJobseeker: true,
    lastName: "",
    birthdate: "",
  },
};
