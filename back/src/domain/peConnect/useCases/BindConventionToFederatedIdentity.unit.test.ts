import {
  authFailed,
  ConventionDtoBuilder,
  expectObjectsToMatch,
  expectToEqual,
} from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import {
  CONVENTION_ID_DEFAULT_UUID,
  InMemoryConventionPoleEmploiAdvisorRepository,
} from "../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../core/eventBus/EventBus";
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
      payload: conventionDtoFromEvent,
    });
    await associatePeConnectFederatedIdentity.execute(conventionDtoFromEvent),
      expect(
        conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
      ).toHaveLength(0);
    await expectObjectsToMatch(outboxRepo.events, [expectedEvent]);
  });

  it("authfailed", async () => {
    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity({ provider: "peConnect", token: authFailed })
      .build();

    await associatePeConnectFederatedIdentity.execute(conventionDtoFromEvent);

    expectObjectsToMatch(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
      [],
    );

    const expectedEvent = createNewEvent({
      topic: "FederatedIdentityNotBoundToConvention",
      payload: conventionDtoFromEvent,
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

    await associatePeConnectFederatedIdentity.execute(conventionDtoFromEvent);

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

    await associatePeConnectFederatedIdentity.execute(conventionDtoFromEvent);

    expect(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
    ).toHaveLength(1);

    // outbox rep
    expect(outboxRepo.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepo.events[0], {
      topic: "FederatedIdentityBoundToConvention",
      payload: conventionDtoFromEvent,
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

    await associatePeConnectFederatedIdentity.execute(conventionDtoFromEvent);

    expect(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
    ).toHaveLength(1);

    // outbox rep
    expect(outboxRepo.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepo.events[0], {
      topic: "FederatedIdentityBoundToConvention",
      payload: conventionDtoFromEvent,
    });
  });

  it("without open slot then no association and FederatedIdentityNotBoundToConvention event", async () => {
    conventionPoleEmploiAdvisorRepo.setConventionPoleEmploiUsersAdvisor([]);

    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity({ provider: "peConnect", token: userPeExternalId })
      .build();

    await associatePeConnectFederatedIdentity.execute(conventionDtoFromEvent);

    expectToEqual(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
      [],
    );

    expectToEqual(outboxRepo.events, [
      createNewEvent({
        topic: "FederatedIdentityNotBoundToConvention",
        payload: conventionDtoFromEvent,
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
