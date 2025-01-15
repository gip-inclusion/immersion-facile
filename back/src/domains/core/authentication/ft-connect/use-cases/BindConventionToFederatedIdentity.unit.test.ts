import {
  ConventionDtoBuilder,
  authFailed,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import { InMemoryOutboxRepository } from "../../../events/adapters/InMemoryOutboxRepository";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../events/ports/EventBus";
import { CustomTimeGateway } from "../../../time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../../unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../../uuid-generator/adapters/UuidGeneratorImplementations";
import {
  CONVENTION_ID_DEFAULT_UUID,
  InMemoryConventionFranceTravailAdvisorRepository,
} from "../adapters/InMemoryConventionFranceTravailAdvisorRepository";
import { FtUserAndAdvisor } from "../dto/FtConnect.dto";
import { conventionFranceTravailUserAdvisorFromDto } from "../entities/ConventionFranceTravailAdvisorEntity";
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

    expect(
      conventionFranceTravailAdvisorRepo.conventionFranceTravailUsersAdvisors,
    ).toHaveLength(0);
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

    expectObjectsToMatch(
      conventionFranceTravailAdvisorRepo.conventionFranceTravailUsersAdvisors,
      [],
    );

    const expectedEvent = createNewEvent({
      topic: "FederatedIdentityNotBoundToConvention",
      payload: { convention: conventionDtoFromEvent, triggeredBy: null },
    });
    expectObjectsToMatch(outboxRepo.events, [expectedEvent]);
  });

  it("should associate convention and federated identity if the federated identity match format", async () => {
    conventionFranceTravailAdvisorRepo.setConventionFranceTravailUsersAdvisor([
      conventionFranceTravailUserAdvisorFromDto(
        userAdvisorDto,
        CONVENTION_ID_DEFAULT_UUID,
      ),
    ]);

    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity({ provider: "peConnect", token: userFtExternalId })
      .build();

    await associateFtConnectFederatedIdentity.execute({
      convention: conventionDtoFromEvent,
    });

    expect(
      conventionFranceTravailAdvisorRepo.conventionFranceTravailUsersAdvisors,
    ).toHaveLength(1);

    expect(
      conventionFranceTravailAdvisorRepo.conventionFranceTravailUsersAdvisors[0]
        .conventionId,
    ).toBe(conventionId);
  });

  it("should save event FtConnectFederatedIdentityAssociated", async () => {
    conventionFranceTravailAdvisorRepo.setConventionFranceTravailUsersAdvisor([
      conventionFranceTravailUserAdvisorFromDto(
        userAdvisorDto,
        CONVENTION_ID_DEFAULT_UUID,
      ),
    ]);

    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity({ provider: "peConnect", token: userFtExternalId })
      .build();

    await associateFtConnectFederatedIdentity.execute({
      convention: conventionDtoFromEvent,
    });

    expect(
      conventionFranceTravailAdvisorRepo.conventionFranceTravailUsersAdvisors,
    ).toHaveLength(1);

    // outbox rep
    expect(outboxRepo.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepo.events[0], {
      topic: "FederatedIdentityBoundToConvention",
      payload: { convention: conventionDtoFromEvent, triggeredBy: null },
    });
  });

  it("without advisor", async () => {
    conventionFranceTravailAdvisorRepo.setConventionFranceTravailUsersAdvisor([
      conventionFranceTravailUserAdvisorFromDto(
        {
          ...userAdvisorDto,
          advisor: undefined,
        },
        CONVENTION_ID_DEFAULT_UUID,
      ),
    ]);

    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity({ provider: "peConnect", token: userFtExternalId })
      .build();

    await associateFtConnectFederatedIdentity.execute({
      convention: conventionDtoFromEvent,
    });

    expect(
      conventionFranceTravailAdvisorRepo.conventionFranceTravailUsersAdvisors,
    ).toHaveLength(1);

    // outbox rep
    expect(outboxRepo.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepo.events[0], {
      topic: "FederatedIdentityBoundToConvention",
      payload: { convention: conventionDtoFromEvent, triggeredBy: null },
    });
  });

  it("without open slot then no association and FederatedIdentityNotBoundToConvention event", async () => {
    conventionFranceTravailAdvisorRepo.setConventionFranceTravailUsersAdvisor(
      [],
    );

    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity({ provider: "peConnect", token: userFtExternalId })
      .build();

    await associateFtConnectFederatedIdentity.execute({
      convention: conventionDtoFromEvent,
    });

    expectToEqual(
      conventionFranceTravailAdvisorRepo.conventionFranceTravailUsersAdvisors,
      [],
    );

    expectToEqual(outboxRepo.events, [
      createNewEvent({
        topic: "FederatedIdentityNotBoundToConvention",
        payload: { convention: conventionDtoFromEvent, triggeredBy: null },
      }),
    ]);
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
  },
};
