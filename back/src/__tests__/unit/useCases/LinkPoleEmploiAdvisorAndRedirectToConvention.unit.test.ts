import { expectTypeToMatchAndEqual } from "../../../_testBuilders/test.helpers";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryPeConnectGateway } from "../../../adapters/secondary/InMemoryPeConnectGateway";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import {
  ConventionPoleEmploiUserAdvisorEntity,
  ExternalPeConnectAdvisor,
  ExternalPeConnectUser,
} from "../../../domain/peConnect/dto/PeConnect.dto";
import { LinkPoleEmploiAdvisorAndRedirectToConvention } from "../../../domain/peConnect/useCases/LinkPoleEmploiAdvisorAndRedirectToConvention";
import { conventionPoleEmploiAdvisorFromDto } from "../../../domain/peConnect/entities/ConventionPoleEmploiAdvisorEntity";

describe("LinkPoleEmploiAdvisorAndRedirectToConvention", () => {
  let linkPoleEmploiAdvisorAndRedirectToConvention: LinkPoleEmploiAdvisorAndRedirectToConvention;
  let uowPerformer: InMemoryUowPerformer;
  let peConnectGateway: InMemoryPeConnectGateway;
  let conventionPoleEmploiAdvisorRepo: InMemoryConventionPoleEmploiAdvisorRepository;

  const baseurl = "https://plop";
  const userPeExternalId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";

  beforeEach(() => {
    const uow = createInMemoryUow();
    conventionPoleEmploiAdvisorRepo = uow.conventionPoleEmploiAdvisorRepo;
    uowPerformer = new InMemoryUowPerformer(uow);
    peConnectGateway = new InMemoryPeConnectGateway(baseurl);

    linkPoleEmploiAdvisorAndRedirectToConvention =
      new LinkPoleEmploiAdvisorAndRedirectToConvention(
        uowPerformer,
        peConnectGateway,
        baseurl,
      );
  });

  describe("Pe Connect correctly identify user", () => {
    it("the returned conventionAdvisor gets stored", async () => {
      peConnectGateway.setUser(peUser);
      peConnectGateway.setAdvisors([
        pePlacementAdvisor,
        peIndemnisationAdvisor,
      ]);
      const authorizationCode = "123";

      const expectedConventionPoleEmploiAdvisorEntity: ConventionPoleEmploiUserAdvisorEntity =
        conventionPoleEmploiAdvisorFromDto({
          email: "jane.smith@pole-emploi.net",
          firstName: "Jane",
          lastName: "Smith",
          userPeExternalId,
          type: "PLACEMENT",
        });

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

      const expectedConventionPoleEmploiAdvisorEntity: ConventionPoleEmploiUserAdvisorEntity =
        conventionPoleEmploiAdvisorFromDto({
          email: "jane.smith@pole-emploi.net",
          firstName: "Jane",
          lastName: "Smith",
          userPeExternalId,
          type: "PLACEMENT",
        });

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

    it("should prefer to have a CAPEMPLOI if user have both PLACEMENT and CAPEMPLOI advisors", async () => {
      peConnectGateway.setUser(peUser);
      peConnectGateway.setAdvisors([
        peIndemnisationAdvisor,
        pePlacementAdvisor,
        peCapemploiAdvisor,
      ]);
      const authorizationCode = "123";

      const expectedConventionPoleEmploiUserAdvisor: ConventionPoleEmploiUserAdvisorEntity =
        conventionPoleEmploiAdvisorFromDto({
          email: "elsa.oldenburg@pole-emploi.net",
          firstName: "Elsa",
          lastName: "Oldenburg",
          userPeExternalId,
          type: "CAPEMPLOI",
        });

      const urlWithQueryParams =
        await linkPoleEmploiAdvisorAndRedirectToConvention.execute(
          authorizationCode,
        );

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?email=john.doe@gmail.com&firstName=John&lastName=Doe`,
      );

      expectTypeToMatchAndEqual(
        conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors[0],
        expectedConventionPoleEmploiUserAdvisor,
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

const peCapemploiAdvisor: ExternalPeConnectAdvisor = {
  civilite: "0",
  mail: "elsa.oldenburg@pole-emploi.net",
  nom: "Oldenburg",
  prenom: "Elsa",
  type: "CAPEMPLOI",
};
