import { expectTypeToMatchAndEqual } from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryPeConnectGateway } from "../../../adapters/secondary/InMemoryPeConnectGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { ConventionPoleEmploiUserAdvisorEntityOpen } from "../../../domain/peConnect/entities/ConventionPoleEmploiAdvisorEntity";
import {
  ExternalPeConnectAdvisor,
  ExternalPeConnectUser,
} from "../../../domain/peConnect/port/PeConnectGateway";
import { LinkPoleEmploiAdvisorAndRedirectToConvention } from "../../../domain/peConnect/useCases/LinkPoleEmploiAdvisorAndRedirectToConvention";

describe("LinkPoleEmploiAdvisorAndRedirectToConvention", () => {
  let linkPoleEmploiAdvisorAndRedirectToConvention: LinkPoleEmploiAdvisorAndRedirectToConvention;
  let uowPerformer: InMemoryUowPerformer;
  let peConnectGateway: InMemoryPeConnectGateway;
  let conventionPoleEmploiAdvisorRepo: InMemoryConventionPoleEmploiAdvisorRepository;

  const baseurl = "https://plop";
  const conventionPoleEmploiUserAdvisorEntityUuid =
    "aaaaac99-9c0a-aaaa-aa6d-6aa9ad38aaaa";

  beforeEach(() => {
    const uow = createInMemoryUow();
    conventionPoleEmploiAdvisorRepo = uow.conventionPoleEmploiAdvisorRepo;
    uowPerformer = new InMemoryUowPerformer({
      ...uow,
    });
    peConnectGateway = new InMemoryPeConnectGateway("https://plop");

    const uuidGenerator = new TestUuidGenerator();
    uuidGenerator.setNextUuid(conventionPoleEmploiUserAdvisorEntityUuid);
    linkPoleEmploiAdvisorAndRedirectToConvention =
      new LinkPoleEmploiAdvisorAndRedirectToConvention({
        uowPerformer,
        uuidGenerator,
        peConnectGateway,
        baseUrlForRedirect: baseurl,
      });
  });

  describe("Pe Connect correctly identify user", () => {
    it("the returned conventionAdvisor gets stored", async () => {
      peConnectGateway.setUser(peUser);
      peConnectGateway.setAdvisors([
        pePlacementAdvisor,
        peIndemnisationAdvisor,
      ]);
      const authorizationCode = "123";

      const expectedConventionPoleEmploiAdvisorEntity: ConventionPoleEmploiUserAdvisorEntityOpen =
        {
          id: conventionPoleEmploiUserAdvisorEntityUuid,
          email: "jane.smith@pole-emploi.net",
          firstName: "Jane",
          lastName: "Smith",
          userPeExternalId: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
          type: "PLACEMENT",
        };

      const urlWithQueryParams =
        await linkPoleEmploiAdvisorAndRedirectToConvention.execute(
          authorizationCode,
        );

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?email=john.doe@gmail.com&firstName=John&lastName=Doe`,
      );

      expectTypeToMatchAndEqual(
        conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors[0],
        expectedConventionPoleEmploiAdvisorEntity,
      );
    });

    it("only PLACEMENT and CAPEMPLOI advisor types are valid for conventionAdvisor", async () => {
      peConnectGateway.setUser(peUser);
      peConnectGateway.setAdvisors([
        peIndemnisationAdvisor,
        pePlacementAdvisor,
      ]);
      const authorizationCode = "123";

      const expectedConventionPoleEmploiAdvisorEntity: ConventionPoleEmploiUserAdvisorEntityOpen =
        {
          id: conventionPoleEmploiUserAdvisorEntityUuid,
          email: "jane.smith@pole-emploi.net",
          firstName: "Jane",
          lastName: "Smith",
          userPeExternalId: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
          type: "PLACEMENT",
        };

      const urlWithQueryParams =
        await linkPoleEmploiAdvisorAndRedirectToConvention.execute(
          authorizationCode,
        );

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?email=john.doe@gmail.com&firstName=John&lastName=Doe`,
      );

      expectTypeToMatchAndEqual(
        conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors[0],
        expectedConventionPoleEmploiAdvisorEntity,
      );
    });
  });
});

const peUser: ExternalPeConnectUser = {
  sub: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
  gender: "male",
  family_name: "Doe",
  given_name: "John",
  email: "john.doe@gmail.com",
  idIdentiteExterne: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
};

const pePlacementAdvisor: ExternalPeConnectAdvisor = {
  civilite: "0",
  mail: "jane.smith@pole-emploi.net",
  nom: "Smith",
  prenom: "Jane",
  type: "PLACEMENT",
};

const peIndemnisationAdvisor: ExternalPeConnectAdvisor = {
  civilite: "1",
  mail: "017jean.dupont@pole-emploi.net",
  nom: "Dupont",
  prenom: "Jean",
  type: "INDEMNISATION",
};
