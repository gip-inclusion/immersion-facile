import { PeConnectIdentity } from "shared/src/federatedIdentities/federatedIdentity.dto";
import { ConventionDtoBuilder } from "shared/src/convention/ConventionDtoBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { PoleEmploiUserAdvisorDto } from "../../../domain/peConnect/dto/PeConnect.dto";
import { conventionPoleEmploiUserAdvisorFromDto } from "../../../domain/peConnect/entities/ConventionPoleEmploiAdvisorEntity";
import { AssociatePeConnectFederatedIdentity } from "../../../domain/peConnect/useCases/AssociateFederatedIdentityPeConnect";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { expectObjectsToMatch } from "../../../_testBuilders/test.helpers";
import { makeCreateNewEvent } from "../../../domain/core/eventBus/EventBus";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";

describe("AssociatePeConnectFederatedIdentity", () => {
  let associatePeConnectFederatedIdentity: AssociatePeConnectFederatedIdentity;
  let uowPerformer: InMemoryUowPerformer;
  let conventionPoleEmploiAdvisorRepo: InMemoryConventionPoleEmploiAdvisorRepository;
  let outboxRepo: InMemoryOutboxRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    conventionPoleEmploiAdvisorRepo = uow.conventionPoleEmploiAdvisorRepo;
    outboxRepo = uow.outboxRepo;
    uowPerformer = new InMemoryUowPerformer(uow);

    const clock = new CustomClock();
    const uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({ clock, uuidGenerator });

    associatePeConnectFederatedIdentity =
      new AssociatePeConnectFederatedIdentity(uowPerformer, createNewEvent);
  });

  it("should not associate convention and federated identity if the federated identity does not match format", async () => {
    conventionPoleEmploiAdvisorRepo.setConventionPoleEmploiUsersAdvisor(
      conventionPoleEmploiUserAdvisorFromDto(userAdvisorDto),
    );

    const conventionDtoFromEvent = new ConventionDtoBuilder()
      .withId(conventionId)
      .withFederatedIdentity(
        "Does not start with peConnect:" as PeConnectIdentity,
      )
      .build();

    await expect(
      associatePeConnectFederatedIdentity.execute(conventionDtoFromEvent),
    ).rejects.toThrow(BadRequestError);
  });

  it("should associate convention and federated identity if the federated identity match format", async () => {
    conventionPoleEmploiAdvisorRepo.setConventionPoleEmploiUsersAdvisor(
      conventionPoleEmploiUserAdvisorFromDto(userAdvisorDto),
    );

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
    conventionPoleEmploiAdvisorRepo.setConventionPoleEmploiUsersAdvisor(
      conventionPoleEmploiUserAdvisorFromDto(userAdvisorDto),
    );

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
const userAdvisorDto: PoleEmploiUserAdvisorDto = {
  email: "elsa.oldenburg@pole-emploi.net",
  firstName: "Elsa",
  lastName: "Oldenburg",
  userPeExternalId,
  type: "CAPEMPLOI",
};
