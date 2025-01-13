import { authFailed, expectToEqual, notJobSeeker } from "shared";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../unit-of-work/adapters/createInMemoryUow";
import { CONVENTION_ID_DEFAULT_UUID } from "../adapters/InMemoryConventionFranceTravailAdvisorRepository";
import { InMemoryPeConnectGateway } from "../adapters/pe-connect-gateway/InMemoryPeConnectGateway";
import { AccessTokenDto } from "../dto/AccessToken.dto";
import {
  FtConnectAdvisorDto,
  FtConnectImmersionAdvisorDto,
} from "../dto/FtConnectAdvisor.dto";
import { FtConnectUserDto } from "../dto/FtConnectUserDto";
import { conventionFranceTravailUserAdvisorFromDto } from "../entities/ConventionFranceTravailAdvisorEntity";
import { LinkPoleEmploiAdvisorAndRedirectToConvention } from "./LinkPoleEmploiAdvisorAndRedirectToConvention";

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

  describe("Pe Connect correctly identify OAuth", () => {
    it("the returned conventionAdvisor gets stored", async () => {
      peConnectGateway.setAccessToken(accessToken);
      peConnectGateway.setUser(peJobseekerUser);
      peConnectGateway.setAdvisors([
        pePlacementAdvisor,
        peIndemnisationAdvisor,
      ]);

      await usecase.execute(authorizationCode);

      expectToEqual(
        uow.conventionPoleEmploiAdvisorRepository
          .conventionPoleEmploiUsersAdvisors,
        [
          conventionFranceTravailUserAdvisorFromDto(
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

      expectToEqual(
        uow.conventionPoleEmploiAdvisorRepository
          .conventionPoleEmploiUsersAdvisors,
        [
          conventionFranceTravailUserAdvisorFromDto(
            {
              advisor: peCapemploiAdvisor,
              user: peJobseekerUser,
            },
            CONVENTION_ID_DEFAULT_UUID,
          ),
        ],
      );
    });

    it("the OAuth info and federated identity are present in the redirect url query parameters", async () => {
      peConnectGateway.setAccessToken(accessToken);
      peConnectGateway.setUser(peJobseekerUser);
      peConnectGateway.setAdvisors([pePlacementAdvisor]);

      const urlWithQueryParams = await usecase.execute(authorizationCode);

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?email=john.doe@gmail.com&firstName=John&lastName=Doe&fedId=${userPeExternalId}&fedIdProvider=peConnect`,
      );
    });
  });

  describe("Wrong path", () => {
    it("On PeConnect auth failure", async () => {
      const urlWithQueryParams = await usecase.execute(authorizationCode);

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?fedIdProvider=peConnect&fedId=${authFailed}`,
      );
      expectToEqual(
        uow.conventionPoleEmploiAdvisorRepository
          .conventionPoleEmploiUsersAdvisors,
        [],
      );
    });

    it("On PeConnect not user info", async () => {
      peConnectGateway.setAccessToken(accessToken);
      peConnectGateway.setUser(undefined);
      peConnectGateway.setAdvisors([pePlacementAdvisor]);
      const urlWithQueryParams = await usecase.execute(authorizationCode);

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?fedIdProvider=peConnect&fedId=${authFailed}`,
      );
      expectToEqual(
        uow.conventionPoleEmploiAdvisorRepository
          .conventionPoleEmploiUsersAdvisors,
        [],
      );
    });

    it("On PeConnected and is not jobseeker should not open slot and provide convention url with notJobSeeker peConnect mode", async () => {
      peConnectGateway.setAccessToken(accessToken);
      peConnectGateway.setUser(peNotJobseekerUser);

      const urlWithQueryParams = await usecase.execute(authorizationCode);

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?email=john.doe@gmail.com&firstName=John&lastName=Doe&fedId=${notJobSeeker}&fedIdProvider=peConnect`,
      );
      expectToEqual(
        uow.conventionPoleEmploiAdvisorRepository
          .conventionPoleEmploiUsersAdvisors,
        [],
      );
    });
  });

  it("On PeConnected and is jobseeker but no advisors should open slot", async () => {
    peConnectGateway.setAccessToken(accessToken);
    peConnectGateway.setUser(peJobseekerUser);

    const urlWithQueryParams = await usecase.execute(authorizationCode);

    expect(urlWithQueryParams).toBe(
      `${baseurl}/demande-immersion?email=john.doe@gmail.com&firstName=John&lastName=Doe&fedId=${peJobseekerUser.peExternalId}&fedIdProvider=peConnect`,
    );
    expectToEqual(
      uow.conventionPoleEmploiAdvisorRepository
        .conventionPoleEmploiUsersAdvisors,
      [
        conventionFranceTravailUserAdvisorFromDto(
          {
            user: peJobseekerUser,
            advisor: undefined,
          },
          CONVENTION_ID_DEFAULT_UUID,
        ),
      ],
    );
  });
});

const peJobseekerUser: FtConnectUserDto = {
  isJobseeker: true,
  firstName: "John",
  lastName: "Doe",
  peExternalId: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
  email: "john.doe@gmail.com",
};
const peNotJobseekerUser: FtConnectUserDto = {
  isJobseeker: false,
  firstName: "John",
  lastName: "Doe",
  peExternalId: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
  email: "john.doe@gmail.com",
};

const pePlacementAdvisor: FtConnectImmersionAdvisorDto = {
  email: "jane.smith@pole-emploi.net",
  lastName: "Smith",
  firstName: "Jane",
  type: "PLACEMENT",
};

const peIndemnisationAdvisor: FtConnectAdvisorDto = {
  email: "017jean.dupont@pole-emploi.net",
  firstName: "Jean",
  lastName: "Dupont",
  type: "INDEMNISATION",
};

const peCapemploiAdvisor: FtConnectImmersionAdvisorDto = {
  email: "elsa.oldenburg@pole-emploi.net",
  lastName: "Oldenburg",
  firstName: "Elsa",
  type: "CAPEMPLOI",
};

const accessToken: AccessTokenDto = {
  expiresIn: 1,
  value: "",
};
