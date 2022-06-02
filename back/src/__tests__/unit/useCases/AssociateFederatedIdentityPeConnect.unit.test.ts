import { PeConnectIdentity } from "shared/src/federatedIdentities/federatedIdentity.dto";
import { ImmersionApplicationDto } from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import { ImmersionApplicationDtoBuilder } from "shared/src/ImmersionApplication/ImmersionApplicationDtoBuilder";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { BadRequestError } from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { PoleEmploiUserAdvisorDto } from "../../../domain/peConnect/dto/PeConnect.dto";
import { conventionPoleEmploiUserAdvisorFromDto } from "../../../domain/peConnect/entities/ConventionPoleEmploiAdvisorEntity";
import { AssociatePeConnectFederatedIdentity } from "../../../domain/peConnect/useCases/AssociateFederatedIdentityPeConnect";

describe("AssociatePeConnectFederatedIdentity", () => {
  let associatePeConnectFederatedIdentity: AssociatePeConnectFederatedIdentity;
  let uowPerformer: InMemoryUowPerformer;
  let conventionPoleEmploiAdvisorRepo: InMemoryConventionPoleEmploiAdvisorRepository;

  beforeEach(() => {
    const uow = createInMemoryUow();
    conventionPoleEmploiAdvisorRepo = uow.conventionPoleEmploiAdvisorRepo;
    uowPerformer = new InMemoryUowPerformer(uow);

    associatePeConnectFederatedIdentity =
      new AssociatePeConnectFederatedIdentity(uowPerformer);
  });

  it("should not associate convention and federated identity if the federated identity does not match format", async () => {
    conventionPoleEmploiAdvisorRepo.setConventionPoleEmploiUsersAdvisor(
      conventionPoleEmploiUserAdvisorFromDto(userAdvisorDto),
    );

    const immersionDtoFromEvent: ImmersionApplicationDto =
      new ImmersionApplicationDtoBuilder()
        .withId(conventionId)
        .withFederatedIdentity(
          "Does not start with peConnect:" as PeConnectIdentity,
        )
        .build();

    await expect(
      associatePeConnectFederatedIdentity.execute(immersionDtoFromEvent),
    ).rejects.toThrow(BadRequestError);
  });

  it("should associate convention and federated identity if the federated identity match format", async () => {
    conventionPoleEmploiAdvisorRepo.setConventionPoleEmploiUsersAdvisor(
      conventionPoleEmploiUserAdvisorFromDto(userAdvisorDto),
    );

    const immersionDtoFromEvent: ImmersionApplicationDto =
      new ImmersionApplicationDtoBuilder()
        .withId(conventionId)
        .withFederatedIdentity(`peConnect:${userPeExternalId}`)
        .build();

    await associatePeConnectFederatedIdentity.execute(immersionDtoFromEvent);

    expect(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors,
    ).toHaveLength(1);

    expect(
      conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors[0]
        .conventionId,
    ).toBe(conventionId);
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
