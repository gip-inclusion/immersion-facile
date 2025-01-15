import { authFailed, expectToEqual, notJobSeeker } from "shared";
import { InMemoryUowPerformer } from "../../../unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../unit-of-work/adapters/createInMemoryUow";
import { CONVENTION_ID_DEFAULT_UUID } from "../adapters/InMemoryConventionFranceTravailAdvisorRepository";
import { InMemoryFtConnectGateway } from "../adapters/ft-connect-gateway/InMemoryFtConnectGateway";
import { AccessTokenDto } from "../dto/AccessToken.dto";
import {
  FtConnectAdvisorDto,
  FtConnectImmersionAdvisorDto,
} from "../dto/FtConnectAdvisor.dto";
import { FtConnectUserDto } from "../dto/FtConnectUserDto";
import { conventionFranceTravailUserAdvisorFromDto } from "../entities/ConventionFranceTravailAdvisorEntity";
import { LinkFranceTravailAdvisorAndRedirectToConvention } from "./LinkFranceTravailAdvisorAndRedirectToConvention";

describe("LinkFranceTravailAdvisorAndRedirectToConvention", () => {
  let uow: InMemoryUnitOfWork;
  let linkFtAdvisorAndRedirectToConvention: LinkFranceTravailAdvisorAndRedirectToConvention;
  let ftConnectGateway: InMemoryFtConnectGateway;

  const baseurl = "https://plop";
  const userFtExternalId = "749dd14f-c82a-48b1-b1bb-fffc5467e4d4";
  const authorizationCode = "123";

  beforeEach(() => {
    uow = createInMemoryUow();
    ftConnectGateway = new InMemoryFtConnectGateway();
    linkFtAdvisorAndRedirectToConvention =
      new LinkFranceTravailAdvisorAndRedirectToConvention(
        new InMemoryUowPerformer(uow),
        ftConnectGateway,
        baseurl,
      );
  });

  describe("Ft Connect correctly identify OAuth", () => {
    it("the returned conventionAdvisor gets stored", async () => {
      ftConnectGateway.setAccessToken(accessToken);
      ftConnectGateway.setUser(ftJobseekerUser);
      ftConnectGateway.setAdvisors([
        ftPlacementAdvisor,
        ftIndemnisationAdvisor,
      ]);

      await linkFtAdvisorAndRedirectToConvention.execute(authorizationCode);

      expectToEqual(
        uow.conventionFranceTravailAdvisorRepository
          .conventionFranceTravailUsersAdvisors,
        [
          conventionFranceTravailUserAdvisorFromDto(
            {
              advisor: ftPlacementAdvisor,
              user: ftJobseekerUser,
            },
            CONVENTION_ID_DEFAULT_UUID,
          ),
        ],
      );
    });

    it("only PLACEMENT and CAPEMPLOI advisor types are valid for conventionAdvisor", async () => {
      ftConnectGateway.setAccessToken(accessToken);
      ftConnectGateway.setUser(ftJobseekerUser);
      ftConnectGateway.setAdvisors([
        ftIndemnisationAdvisor,
        ftPlacementAdvisor,
        ftCapEmploiAdvisor,
      ]);

      await linkFtAdvisorAndRedirectToConvention.execute(authorizationCode);

      expectToEqual(
        uow.conventionFranceTravailAdvisorRepository
          .conventionFranceTravailUsersAdvisors,
        [
          conventionFranceTravailUserAdvisorFromDto(
            {
              advisor: ftCapEmploiAdvisor,
              user: ftJobseekerUser,
            },
            CONVENTION_ID_DEFAULT_UUID,
          ),
        ],
      );
    });

    it("the OAuth info and federated identity are present in the redirect url query parameters", async () => {
      ftConnectGateway.setAccessToken(accessToken);
      ftConnectGateway.setUser(ftJobseekerUser);
      ftConnectGateway.setAdvisors([ftPlacementAdvisor]);

      const urlWithQueryParams =
        await linkFtAdvisorAndRedirectToConvention.execute(authorizationCode);

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?email=john.doe@gmail.com&firstName=John&lastName=Doe&fedId=${userFtExternalId}&fedIdProvider=peConnect`,
      );
    });
  });

  describe("Wrong path", () => {
    it("On FtConnect auth failure", async () => {
      const urlWithQueryParams =
        await linkFtAdvisorAndRedirectToConvention.execute(authorizationCode);

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?fedIdProvider=peConnect&fedId=${authFailed}`,
      );
      expectToEqual(
        uow.conventionFranceTravailAdvisorRepository
          .conventionFranceTravailUsersAdvisors,
        [],
      );
    });

    it("On FtConnect not user info", async () => {
      ftConnectGateway.setAccessToken(accessToken);
      ftConnectGateway.setUser(undefined);
      ftConnectGateway.setAdvisors([ftPlacementAdvisor]);
      const urlWithQueryParams =
        await linkFtAdvisorAndRedirectToConvention.execute(authorizationCode);

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?fedIdProvider=peConnect&fedId=${authFailed}`,
      );
      expectToEqual(
        uow.conventionFranceTravailAdvisorRepository
          .conventionFranceTravailUsersAdvisors,
        [],
      );
    });

    it("On FtConnected and is not jobseeker should not open slot and provide convention url with notJobSeeker peConnect mode", async () => {
      ftConnectGateway.setAccessToken(accessToken);
      ftConnectGateway.setUser(ftNotJobseekerUser);

      const urlWithQueryParams =
        await linkFtAdvisorAndRedirectToConvention.execute(authorizationCode);

      expect(urlWithQueryParams).toBe(
        `${baseurl}/demande-immersion?email=john.doe@gmail.com&firstName=John&lastName=Doe&fedId=${notJobSeeker}&fedIdProvider=peConnect`,
      );
      expectToEqual(
        uow.conventionFranceTravailAdvisorRepository
          .conventionFranceTravailUsersAdvisors,
        [],
      );
    });
  });

  it("On FtConnected and is jobseeker but no advisors should open slot", async () => {
    ftConnectGateway.setAccessToken(accessToken);
    ftConnectGateway.setUser(ftJobseekerUser);

    const urlWithQueryParams =
      await linkFtAdvisorAndRedirectToConvention.execute(authorizationCode);

    expect(urlWithQueryParams).toBe(
      `${baseurl}/demande-immersion?email=john.doe@gmail.com&firstName=John&lastName=Doe&fedId=${ftJobseekerUser.peExternalId}&fedIdProvider=peConnect`,
    );
    expectToEqual(
      uow.conventionFranceTravailAdvisorRepository
        .conventionFranceTravailUsersAdvisors,
      [
        conventionFranceTravailUserAdvisorFromDto(
          {
            user: ftJobseekerUser,
            advisor: undefined,
          },
          CONVENTION_ID_DEFAULT_UUID,
        ),
      ],
    );
  });
});

const ftJobseekerUser: FtConnectUserDto = {
  isJobseeker: true,
  firstName: "John",
  lastName: "Doe",
  peExternalId: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
  email: "john.doe@gmail.com",
};
const ftNotJobseekerUser: FtConnectUserDto = {
  isJobseeker: false,
  firstName: "John",
  lastName: "Doe",
  peExternalId: "749dd14f-c82a-48b1-b1bb-fffc5467e4d4",
  email: "john.doe@gmail.com",
};

const ftPlacementAdvisor: FtConnectImmersionAdvisorDto = {
  email: "jane.smith@france-travail.net",
  lastName: "Smith",
  firstName: "Jane",
  type: "PLACEMENT",
};

const ftIndemnisationAdvisor: FtConnectAdvisorDto = {
  email: "017jean.dupont@france-travail.net",
  firstName: "Jean",
  lastName: "Dupont",
  type: "INDEMNISATION",
};

const ftCapEmploiAdvisor: FtConnectImmersionAdvisorDto = {
  email: "elsa.oldenburg@france-travail.net",
  lastName: "Oldenburg",
  firstName: "Elsa",
  type: "CAPEMPLOI",
};

const accessToken: AccessTokenDto = {
  expiresIn: 1,
  value: "",
};
