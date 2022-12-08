import { expectTypeToMatchAndEqual } from "shared";
import {
  createInMemoryUow,
  InMemoryUnitOfWork,
} from "../../../adapters/primary/config/uowConfig";
import { CONVENTION_ID_DEFAULT_UUID } from "../../../adapters/secondary/InMemoryConventionPoleEmploiAdvisorRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { InMemoryPeConnectGateway } from "../../../adapters/secondary/PeConnectGateway/InMemoryPeConnectGateway";
import { conventionPoleEmploiUserAdvisorFromDto } from "../../../domain/peConnect/entities/ConventionPoleEmploiAdvisorEntity";
import { LinkPoleEmploiAdvisorAndRedirectToConvention } from "../../../domain/peConnect/useCases/LinkPoleEmploiAdvisorAndRedirectToConvention";
import { AccessTokenDto } from "../dto/AccessToken.dto";
import {
  AllPeConnectAdvisorDto,
  SupportedPeConnectAdvisorDto,
} from "../dto/PeConnectAdvisor.dto";
import { PeConnectUserDto } from "../dto/PeConnectUser.dto";

describe("LinkPoleEmploiAdvisorAndRedirectToConvention", () => {
  let uow: InMemoryUnitOfWork;
  let usecase: LinkPoleEmploiAdvisorAndRedirectToConvention;
  let peConnectGateway: InMemoryPeConnectGateway;

  const baseurl = "https://plop";
  const userPeExternalId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";
  const authorizationCode = "123";

  beforeEach(() => {
    uow = createInMemoryUow();
    peConnectGateway = new InMemoryPeConnectGateway();
    usecase = new LinkPoleEmploiAdvisorAndRedirectToConvention(
      new InMemoryUowPerformer(uow),
      peConnectGateway,
      baseurl,
    );
  });

  describe("Pe Connect correctly identify user", () => {
    it("the returned conventionAdvisor gets stored", async () => {
      peConnectGateway.setAccessToken(accessToken);
      peConnectGateway.setUser(peJobseekerUser);
      peConnectGateway.setAdvisors([
        pePlacementAdvisor,
        peIndemnisationAdvisor,
      ]);

      await usecase.execute(authorizationCode);

      expectTypeToMatchAndEqual(
        uow.conventionPoleEmploiAdvisorRepository
          .conventionPoleEmploiUsersAdvisors,
        [
          conventionPoleEmploiUserAdvisorFromDto(
            {
              advisor: pePlacementAdvisor,
              user: peJobseekerUser,
            },
            CONVENTION_ID_DEFAULT_UUID,
          ),
        ],
      );
    });

    it("only PLACEMENT and CAPEMPLOI advisor types are valid for conventionAdvisor", async () => {
      peConnectGateway.setAccessToken(accessToken);
      peConnectGateway.setUser(peJobseekerUser);
      peConnectGateway.setAdvisors([
        peIndemnisationAdvisor,
        pePlacementAdvisor,
        peCapemploiAdvisor,
      ]);

      await usecase.execute(authorizationCode);

      expectTypeToMatchAndEqual(
        uow.conventionPoleEmploiAdvisorRepository
          .conventionPoleEmploiUsersAdvisors,
        [
          conventionPoleEmploiUserAdvisorFromDto(
            {
              advisor: peCapemploiAdvisor,
              user: peJobseekerUser,
            },
            CONVENTION_ID_DEFAULT_UUID,
          ),
        ],
      );
    });

    it("the user info and federated identity are present in the redirect url query parameters", async () => {
      peConnectGateway.setAccessToken(accessToken);
      peConnectGateway.setUser(peJobseekerUser);
      peConnectGateway.setAdvisors([pePlacementAdvisor]);

      const urlWithQueryParams = await usecase.execute(authorizationCode);

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?email=john.doe@gmail.com&firstName=John&lastName=Doe&federatedIdentity=peConnect:${userPeExternalId}`,
      );
    });
  });

  describe("Wrong path", () => {
    it("On PeConnect auth failure", async () => {
      const urlWithQueryParams = await usecase.execute(authorizationCode);

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?federatedIdentity=peConnect:AuthFailed`,
      );
      expectTypeToMatchAndEqual(
        uow.conventionPoleEmploiAdvisorRepository
          .conventionPoleEmploiUsersAdvisors,
        [],
      );
    });

    it("On PeConnected and is not jobseeker", async () => {
      peConnectGateway.setAccessToken(accessToken);
      peConnectGateway.setUser(peNotJobseekerUser);

      const urlWithQueryParams = await usecase.execute(authorizationCode);

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?email=john.doe@gmail.com&firstName=John&lastName=Doe&federatedIdentity=peConnect:${peJobseekerUser.peExternalId}`,
      );
      expectTypeToMatchAndEqual(
        uow.conventionPoleEmploiAdvisorRepository
          .conventionPoleEmploiUsersAdvisors,
        [
          conventionPoleEmploiUserAdvisorFromDto(
            {
              advisor: undefined,
              user: peNotJobseekerUser,
            },
            CONVENTION_ID_DEFAULT_UUID,
          ),
        ],
      );
    });
  });

  it("On PeConnected and is jobseeker but no advisors", async () => {
    peConnectGateway.setAccessToken(accessToken);
    peConnectGateway.setUser(peJobseekerUser);

    const urlWithQueryParams = await usecase.execute(authorizationCode);

    expect(urlWithQueryParams).toBe(
      `${baseurl}/demande-immersion?email=john.doe@gmail.com&firstName=John&lastName=Doe&federatedIdentity=peConnect:${peJobseekerUser.peExternalId}`,
    );
    expectTypeToMatchAndEqual(
      uow.conventionPoleEmploiAdvisorRepository
        .conventionPoleEmploiUsersAdvisors,
      [
        conventionPoleEmploiUserAdvisorFromDto(
          {
            advisor: undefined,
            user: peJobseekerUser,
          },
          CONVENTION_ID_DEFAULT_UUID,
        ),
      ],
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
const peNotJobseekerUser: PeConnectUserDto = {
  isJobseeker: false,
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

const accessToken: AccessTokenDto = {
  expiresIn: 1,
  value: "",
};
