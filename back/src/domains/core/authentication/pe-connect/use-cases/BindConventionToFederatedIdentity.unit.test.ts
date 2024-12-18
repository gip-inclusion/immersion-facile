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
  InMemoryConventionPoleEmploiAdvisorRepository,
} from "../adapters/InMemoryConventionPoleEmploiAdvisorRepository";
import { PeUserAndAdvisor } from "../dto/PeConnect.dto";
import { conventionPoleEmploiUserAdvisorFromDto } from "../entities/ConventionPoleEmploiAdvisorEntity";
import { BindConventionToFederatedIdentity } from "./BindConventionToFederatedIdentity";

describe("AssociatePeConnectFederatedIdentity", () => {
  let associatePeConnectFederatedIdentity: BindConventionToFederatedIdentity;
  let uowPerformer: InMemoryUowPerformer;
  let conventionPoleEmploiAdvisorRepo: InMemoryConventionPoleEmploiAdvisorRepository;
  let outboxRepo: InMemoryOutboxRepository;
  let createNewEvent: CreateNewEvent;
  beforeEach(() => {
    const uow = createInMemoryUow();
    conventionPoleEmploiAdvisorRepo = uow.conventionPoleEmploiAdvisorRepository;
    outboxRepo = uow.outboxRepository;
    uowPerformer = new InMemoryUowPerformer(uow);

    const uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({
      timeGateway: new CustomTimeGateway(),
      uuidGenerator,
    });

    associatePeConnectFederatedIdentity = new BindConventionToFederatedIdentity(
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
    await associatePeConnectFederatedIdentity.execute({
      convention: conventionDtoFromEvent,
    });

    expect(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
    ).toHaveLength(0);
    expectObjectsToMatch(outboxRepo.events, [expectedEvent]);
  });

  it("authfailed", async () => {
    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity({ provider: "peConnect", token: authFailed })
      .build();

    await associatePeConnectFederatedIdentity.execute({
      convention: conventionDtoFromEvent,
    });

    expectObjectsToMatch(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
      [],
    );

    const expectedEvent = createNewEvent({
      topic: "FederatedIdentityNotBoundToConvention",
      payload: { convention: conventionDtoFromEvent, triggeredBy: null },
    });
    expectObjectsToMatch(outboxRepo.events, [expectedEvent]);
  });

  it("should associate convention and federated identity if the federated identity match format", async () => {
    conventionPoleEmploiAdvisorRepo.setConventionPoleEmploiUsersAdvisor([
      conventionPoleEmploiUserAdvisorFromDto(
        userAdvisorDto,
        CONVENTION_ID_DEFAULT_UUID,
      ),
    ]);

    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity({ provider: "peConnect", token: userPeExternalId })
      .build();

    await associatePeConnectFederatedIdentity.execute({
      convention: conventionDtoFromEvent,
    });

    expect(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
    ).toHaveLength(1);

    expect(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors[0]
        .conventionId,
    ).toBe(conventionId);
  });

  it("should save event PeConnectFederatedIdentityAssociated", async () => {
    conventionPoleEmploiAdvisorRepo.setConventionPoleEmploiUsersAdvisor([
      conventionPoleEmploiUserAdvisorFromDto(
        userAdvisorDto,
        CONVENTION_ID_DEFAULT_UUID,
      ),
    ]);

    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity({ provider: "peConnect", token: userPeExternalId })
      .build();

    await associatePeConnectFederatedIdentity.execute({
      convention: conventionDtoFromEvent,
    });

    expect(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
    ).toHaveLength(1);

    // outbox rep
    expect(outboxRepo.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepo.events[0], {
      topic: "FederatedIdentityBoundToConvention",
      payload: { convention: conventionDtoFromEvent, triggeredBy: null },
    });
  });

  it("without advisor", async () => {
    conventionPoleEmploiAdvisorRepo.setConventionPoleEmploiUsersAdvisor([
      conventionPoleEmploiUserAdvisorFromDto(
        {
          ...userAdvisorDto,
          advisor: undefined,
        },
        CONVENTION_ID_DEFAULT_UUID,
      ),
    ]);

    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity({ provider: "peConnect", token: userPeExternalId })
      .build();

    await associatePeConnectFederatedIdentity.execute({
      convention: conventionDtoFromEvent,
    });

    expect(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
    ).toHaveLength(1);

    // outbox rep
    expect(outboxRepo.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepo.events[0], {
      topic: "FederatedIdentityBoundToConvention",
      payload: { convention: conventionDtoFromEvent, triggeredBy: null },
    });
  });

  it("without open slot then no association and FederatedIdentityNotBoundToConvention event", async () => {
    conventionPoleEmploiAdvisorRepo.setConventionPoleEmploiUsersAdvisor([]);

    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity({ provider: "peConnect", token: userPeExternalId })
      .build();

    await associatePeConnectFederatedIdentity.execute({
      convention: conventionDtoFromEvent,
    });

    expectToEqual(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
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
const userPeExternalId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";
const userAdvisorDto: PeUserAndAdvisor = {
  advisor: {
    email: "elsa.oldenburg@pole-emploi.net",
    firstName: "Elsa",
    lastName: "Oldenburg",
    type: "CAPEMPLOI",
  },
  user: {
    peExternalId: userPeExternalId,
    email: "",
    firstName: "",
    isJobseeker: true,
    lastName: "",
  },
};
