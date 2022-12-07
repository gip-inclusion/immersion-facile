import { expectTypeToMatchAndEqual } from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { InMemoryConventionPoleEmploiAdvisorRepository } from "../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryPeConnectGateway } from "../../../adapters/secondary/PeConnectGateway/InMemoryPeConnectGateway";
import { conventionPoleEmploiUserAdvisorFromDto } from "../../../domain/peConnect/entities/ConventionPoleEmploiAdvisorEntity";
import { LinkPoleEmploiAdvisorAndRedirectToConvention } from "../../../domain/peConnect/useCases/LinkPoleEmploiAdvisorAndRedirectToConvention";
import { ConventionPoleEmploiUserAdvisorEntity } from "../dto/PeConnect.dto";
import {
  AllPeConnectAdvisorDto,
  SupportedPeConnectAdvisorDto,
} from "../dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../dto/PeConnectUser.dto";

describe("LinkPoleEmploiAdvisorAndRedirectToConvention", () => {
  let linkPoleEmploiAdvisorAndRedirectToConvention: LinkPoleEmploiAdvisorAndRedirectToConvention;
  let uowPerformer: InMemoryUowPerformer;
  let peConnectGateway: InMemoryPeConnectGateway;
  let conventionPoleEmploiAdvisorRepo: InMemoryConventionPoleEmploiAdvisorRepository;

  const baseurl = "https://plop";
  const userPeExternalId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";

  const authorizationCode = "123";

  beforeEach(() => {
    const uow = createInMemoryUow();
    conventionPoleEmploiAdvisorRepo = uow.conventionPoleEmploiAdvisorRepository;
    uowPerformer = new InMemoryUowPerformer(uow);
    peConnectGateway = new InMemoryPeConnectGateway();

    linkPoleEmploiAdvisorAndRedirectToConvention =
      new LinkPoleEmploiAdvisorAndRedirectToConvention(
        uowPerformer,
        peConnectGateway,
        baseurl,
      );
  });

  describe.skip("Pe Connect correctly identify user", () => {
    it("the returned conventionAdvisor gets stored", async () => {
      peConnectGateway.setUser(peJobseekerUser);
      peConnectGateway.setAdvisors([
        pePlacementAdvisor,
        peIndemnisationAdvisor,
      ]);
      const authorizationCode = "123";

      const expectedConventionPoleEmploiAdvisorEntity: ConventionPoleEmploiUserAdvisorEntity =
        conventionPoleEmploiUserAdvisorFromDto({
          advisor: pePlacementAdvisor,
          user: peJobseekerUser,
        });

      await linkPoleEmploiAdvisorAndRedirectToConvention.execute(
        authorizationCode,
      );

      expectTypeToMatchAndEqual(
        conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors[0],
        expectedConventionPoleEmploiAdvisorEntity,
      );
    });

    it("only PLACEMENT and CAPEMPLOI advisor types are valid for conventionAdvisor", async () => {
      peConnectGateway.setUser(peJobseekerUser);
      peConnectGateway.setAdvisors([
        peIndemnisationAdvisor,
        pePlacementAdvisor,
        peCapemploiAdvisor,
      ]);

      const expectedConventionPoleEmploiUserAdvisor: ConventionPoleEmploiUserAdvisorEntity =
        conventionPoleEmploiUserAdvisorFromDto({
          advisor: peCapemploiAdvisor,
          user: peJobseekerUser,
        });

      await linkPoleEmploiAdvisorAndRedirectToConvention.execute(
        authorizationCode,
      );

      expectTypeToMatchAndEqual(
        conventionPoleEmploiAdvisorRepo.conventionPoleEmploiUsersAdvisors[0],
        expectedConventionPoleEmploiUserAdvisor,
      );
    });

    it("the user info and federated identity are present in the redirect url query parameters", async () => {
      peConnectGateway.setUser(peJobseekerUser);
      peConnectGateway.setAdvisors([pePlacementAdvisor]);

      const urlWithQueryParams =
        await linkPoleEmploiAdvisorAndRedirectToConvention.execute(
          authorizationCode,
        );

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?email=john.doe@gmail.com&firstName=John&lastName=Doe&federatedIdentity=peConnect:${userPeExternalId}`,
      );
    });
  });

  describe("Wrong path", () => {
    it("On PeConnect auth failure", async () => {
      const urlWithQueryParams =
        await linkPoleEmploiAdvisorAndRedirectToConvention.execute(
          authorizationCode,
        );

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?federatedIdentity=peConnect:AuthFailed`,
      );
    });

    it("On PeConnected but no advisors", async () => {
      peConnectGateway.setAccessToken({
        expiresIn: 1,
        value: "",
      });
      peConnectGateway.setUser(peJobseekerUser);
      //peConnectGateway.setAdvisors([pePlacementAdvisor]);

      const urlWithQueryParams =
        await linkPoleEmploiAdvisorAndRedirectToConvention.execute(
          authorizationCode,
        );

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?federatedIdentity=peConnect:${peJobseekerUser.peExternalId}`,
      );
    });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mockedUser: PeConnectUserDto = {
    isJobseeker: true,
    firstName: "John",
    lastName: "Doe",
    peExternalId: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
    email: "john.doe@gmail.com",
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const mockedValidAdvisor: AllPeConnectAdvisorDto = {
    email: "elsa.oldenburg@pole-emploi.net",
    firstName: "Elsa",
    lastName: "Oldenburg",
    type: "CAPEMPLOI",
  };

  const peJobseekerUser: PeConnectUserDto = {
    isJobseeker: true,
    firstName: "John",
    lastName: "Doe",
    peExternalId: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
    email: "john.doe@gmail.com",
  };

  const pePlacementAdvisor: SupportedPeConnectAdvisorDto = {
    email: "jane.smith@pole-emploi.net",
    lastName: "Smith",
    firstName: "Jane",
    type: "PLACEMENT",
  };

  const peIndemnisationAdvisor: AllPeConnectAdvisorDto = {
    email: "017jean.dupont@pole-emploi.net",
    firstName: "Jean",
    lastName: "Dupont",
    type: "INDEMNISATION",
  };

  const peCapemploiAdvisor: SupportedPeConnectAdvisorDto = {
    email: "elsa.oldenburg@pole-emploi.net",
    lastName: "Oldenburg",
    firstName: "Elsa",
    type: "CAPEMPLOI",
  };
});
