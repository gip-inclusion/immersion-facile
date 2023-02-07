import {
  ConventionDtoBuilder,
  ConventionFederatedIdentityString,
  expectObjectsToMatch,
} from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import {
  CONVENTION_ID_DEFAULT_UUID,
  InMemoryConventionPoleEmploiAdvisorRepository,
} from "../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { PeUserAndAdvisor } from "../dto/PeConnect.dto";
import { conventionPoleEmploiUserAdvisorFromDto } from "../entities/ConventionPoleEmploiAdvisorEntity";
import { AssociatePeConnectFederatedIdentity } from "./AssociateFederatedIdentityPeConnect";

describe("AssociatePeConnectFederatedIdentity", () => {
  let associatePeConnectFederatedIdentity: AssociatePeConnectFederatedIdentity;
  let uowPerformer: InMemoryUowPerformer;
  let conventionPoleEmploiAdvisorRepo: InMemoryConventionPoleEmploiAdvisorRepository;
  let outboxRepo: InMemoryOutboxRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    conventionPoleEmploiAdvisorRepo = uow.conventionPoleEmploiAdvisorRepository;
    outboxRepo = uow.outboxRepository;
    uowPerformer = new InMemoryUowPerformer(uow);

    const uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({
      timeGateway: new CustomTimeGateway(),
      uuidGenerator,
    });

    associatePeConnectFederatedIdentity =
      new AssociatePeConnectFederatedIdentity(uowPerformer, createNewEvent);
  });

  it("should not associate convention and federated identity if the federated identity does not match format", async () => {
    conventionPoleEmploiAdvisorRepo.setConventionPoleEmploiUsersAdvisor([
      conventionPoleEmploiUserAdvisorFromDto(
        userAdvisorDto,
        CONVENTION_ID_DEFAULT_UUID,
      ),
    ]);

    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity(
        "Does not start with peConnect:" as ConventionFederatedIdentityString,
      )
      .build();

    await expect(
      associatePeConnectFederatedIdentity.execute(conventionDtoFromEvent),
    ).rejects.toThrow(BadRequestError);
  });
  it("should not associate convention if no federatedIdentity is provided", async () => {
    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .build();

    await associatePeConnectFederatedIdentity.execute(conventionDtoFromEvent),
      expect(
        conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
      ).toHaveLength(0);
    await expect(outboxRepo.events).toHaveLength(0);
  });

  it("should not associate convention if no federatedIdentity is 'noIdentityProvider'", async () => {
    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity(undefined)
      .build();

    await associatePeConnectFederatedIdentity.execute(conventionDtoFromEvent),
      expect(
        conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
      ).toHaveLength(0);
    await expect(outboxRepo.events).toHaveLength(0);
  });

  it("authfailed", async () => {
    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity("peConnect:AuthFailed")
      .build();

    await associatePeConnectFederatedIdentity.execute(conventionDtoFromEvent);

    expectObjectsToMatch(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
      [],
    );
    expectObjectsToMatch(outboxRepo.events, []);
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
      .withFederatedIdentity(`peConnect:${userPeExternalId}`)
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
      .withFederatedIdentity(`peConnect:${userPeExternalId}`)
      .build();

    await associatePeConnectFederatedIdentity.execute(conventionDtoFromEvent);

    expect(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
    ).toHaveLength(1);

    // outbox rep
    expect(outboxRepo.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepo.events[0], {
      topic: "PeConnectFederatedIdentityAssociated",
      payload: {
        conventionId,
        peExternalId: userPeExternalId,
      },
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
      .withFederatedIdentity(`peConnect:${userPeExternalId}`)
      .build();

    await associatePeConnectFederatedIdentity.execute(conventionDtoFromEvent);

    expect(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
    ).toHaveLength(1);

    // outbox rep
    expect(outboxRepo.events).toHaveLength(1);
    expectObjectsToMatch(outboxRepo.events[0], {
      topic: "PeConnectFederatedIdentityAssociated",
      payload: {
        conventionId,
        peExternalId: userPeExternalId,
      },
    });
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
