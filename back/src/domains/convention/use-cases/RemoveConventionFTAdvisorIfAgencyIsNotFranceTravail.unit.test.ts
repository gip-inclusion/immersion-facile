import {
  AgencyDtoBuilder,
  type ConventionId,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import type { FtConnectImmersionAdvisorDto } from "../../core/authentication/ft-connect/dto/FtConnectAdvisor.dto";
import type { FtConnectUserDto } from "../../core/authentication/ft-connect/dto/FtConnectUserDto";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  makeRemoveConventionFTAdvisorIfAgencyIsNotFranceTravail,
  type RemoveConventionFTAdvisorIfAgencyIsNotFranceTravail,
} from "./RemoveConventionFTAdvisorIfAgencyIsNotFranceTravail";

describe("RemoveConventionFTAdvisorIfAgencyIsNotFranceTravail", () => {
  const conventionId = "add5c20e-6dd2-45af-affe-927358005251";
  const ftAgency = new AgencyDtoBuilder()
    .withId("ft-agency-id")
    .withKind("pole-emploi")
    .build();
  const missionLocaleAgency = new AgencyDtoBuilder()
    .withId("ml-agency-id")
    .withKind("mission-locale")
    .build();
  const userFtExternalId = "92f44bbf-103d-4312-bd74-217c7d79f618";
  const ftConnectUser: FtConnectUserDto = {
    email: "",
    firstName: "",
    isJobseeker: true,
    lastName: "",
    peExternalId: userFtExternalId,
    birthdate: "1990-01-01",
  };
  const ftAdvisor: FtConnectImmersionAdvisorDto = {
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean.dupont@pole-emploi.fr",
    type: "PLACEMENT",
  };

  let uow: InMemoryUnitOfWork;
  let usecase: RemoveConventionFTAdvisorIfAgencyIsNotFranceTravail;

  beforeEach(() => {
    uow = createInMemoryUow();
    usecase = makeRemoveConventionFTAdvisorIfAgencyIsNotFranceTravail({
      uowPerformer: new InMemoryUowPerformer(uow),
    });
  });

  describe("Wrong paths", () => {
    it("throws if requested agency is not found", async () => {
      await expectPromiseToFailWithError(
        usecase.execute({
          agencyId: missionLocaleAgency.id,
          conventionId,
        }),
        errors.agency.notFound({ agencyId: missionLocaleAgency.id }),
      );
    });
  });

  describe("Right paths", () => {
    it("removes convention France Travail advisor when new agency is not France Travail", async () => {
      uow.agencyRepository.agencies = [
        toAgencyWithRights(missionLocaleAgency, {}),
      ];
      saveConventionFranceTravailAdvisor({
        advisor: ftAdvisor,
        user: ftConnectUser,
        conventionId,
      });

      await usecase.execute({
        agencyId: missionLocaleAgency.id,
        conventionId,
      });

      expect(
        uow.conventionFranceTravailAdvisorRepository
          .conventionFranceTravailUsers[conventionId],
      ).toBeUndefined();
    });

    it("keeps convention France Travail advisor when new agency is France Travail", async () => {
      uow.agencyRepository.agencies = [toAgencyWithRights(ftAgency, {})];
      saveConventionFranceTravailAdvisor({
        advisor: ftAdvisor,
        user: ftConnectUser,
        conventionId,
      });

      await usecase.execute({
        agencyId: ftAgency.id,
        conventionId,
      });

      expectToEqual(
        uow.conventionFranceTravailAdvisorRepository
          .conventionFranceTravailUsers[conventionId],
        ftConnectUser.peExternalId,
      );
    });
  });

  const saveConventionFranceTravailAdvisor = ({
    advisor,
    user,
    conventionId,
  }: {
    advisor: FtConnectImmersionAdvisorDto;
    user: FtConnectUserDto;
    conventionId: ConventionId;
  }) => {
    uow.conventionFranceTravailAdvisorRepository.conventionFranceTravailUsers[
      conventionId
    ] = user.peExternalId;
    uow.conventionFranceTravailAdvisorRepository.ftConnectedUsers[
      user.peExternalId
    ] = {
      advisor,
      user,
    };
  };
});
