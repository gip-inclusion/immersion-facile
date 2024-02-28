import {
  AgencyDtoBuilder,
  AgencyGroup,
  AuthenticatedUser,
  InclusionConnectedUser,
  expectToEqual,
} from "shared";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../adapters/primary/config/uowConfig";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { LinkFranceTravailUsersToTheirAgencies } from "./LinkFranceTravailUsersToTheirAgencies";

const codeSafir = "546546645";
const agencyGroupCodeSafir = "my-group-safir-code";
const agency = new AgencyDtoBuilder().withCodeSafir(codeSafir).build();
const agency1InGroup = new AgencyDtoBuilder()
  .withId("agency-id-1")
  .withCodeSafir("agency-safir-1")
  .build();

const agency2InGroup = new AgencyDtoBuilder()
  .withId("agency-id-2")
  .withCodeSafir("agency-safir-2")
  .build();

const agency3InGroup = new AgencyDtoBuilder()
  .withId("agency-id-3")
  .withCodeSafir("agency-safir-3")
  .build();

const agenciesInRepo = [agency, agency1InGroup, agency2InGroup, agency3InGroup];

const defaultUser: AuthenticatedUser = {
  id: "my-user-id",
  firstName: "John",
  lastName: "Doe",
  externalId: "my-external-id",
  email: "john.doe@inclusion.com",
};

describe("LinkFranceTravailUsersToTheirAgencies", () => {
  let uow: InMemoryUnitOfWork;
  let linkFranceTravailUsersToTheirAgencies: LinkFranceTravailUsersToTheirAgencies;

  beforeEach(() => {
    uow = createInMemoryUow();
    linkFranceTravailUsersToTheirAgencies =
      new LinkFranceTravailUsersToTheirAgencies(new InMemoryUowPerformer(uow));
    uow.authenticatedUserRepository.users = [defaultUser];
    uow.agencyRepository.setAgencies(agenciesInRepo);
  });

  describe("when no safir code is provided", () => {
    it("does nothing", async () => {
      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: "my-user-id",
        provider: "inclusionConnect",
        codeSafir: null,
      });

      expectToEqual(uow.authenticatedUserRepository.users, [defaultUser]);
      expectToEqual(
        uow.inclusionConnectedUserRepository.agencyRightsByUserId,
        {},
      );
    });
  });

  describe("when safir code is provided", () => {
    it("add agency right to IC user if user has no rights on agency", async () => {
      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: "my-user-id",
        provider: "inclusionConnect",
        codeSafir: codeSafir,
      });

      expectToEqual(uow.inclusionConnectedUserRepository.agencyRightsByUserId, {
        [defaultUser.id]: [{ agency, role: "validator" }],
      });
    });

    it("don't add agency right to IC user if user already has rights on agency", async () => {
      const icUser: InclusionConnectedUser = {
        ...defaultUser,
        agencyRights: [{ agency, role: "agencyOwner" }],
        establishmentDashboards: {},
      };

      uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([icUser]);

      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: "my-user-id",
        provider: "inclusionConnect",
        codeSafir: codeSafir,
      });

      expectToEqual(uow.inclusionConnectedUserRepository.agencyRightsByUserId, {
        [icUser.id]: [{ agency, role: "agencyOwner" }],
      });
    });

    it("replace agency right to IC user if user already has rights on agency and current right is toReview", async () => {
      const icUser: InclusionConnectedUser = {
        ...defaultUser,
        agencyRights: [{ agency, role: "toReview" }],
        establishmentDashboards: {},
      };

      uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([icUser]);

      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: "my-user-id",
        provider: "inclusionConnect",
        codeSafir: codeSafir,
      });

      expectToEqual(uow.inclusionConnectedUserRepository.agencyRightsByUserId, {
        [icUser.id]: [{ agency, role: "validator" }],
      });
    });

    it("don't add agency right to IC user if there is no agency with this code safir", async () => {
      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: "my-user-id",
        provider: "inclusionConnect",
        codeSafir: "not-existing-code-safir",
      });

      expectToEqual(
        uow.inclusionConnectedUserRepository.agencyRightsByUserId,
        {},
      );
    });
  });
  describe("when safir code matches agency group", () => {
    const agencyGroup: AgencyGroup = {
      siret: "12345678902345",
      kind: "france-travail",
      email: "agency-group-1-email@gmail.com",
      codeSafir: agencyGroupCodeSafir,
      departments: ["87", "23", "19"],
      name: "DR du limousin",
      scope: "direction-régionale",
      agencyIds: [agency1InGroup.id, agency2InGroup.id, agency3InGroup.id],
      ccEmails: ["fake-email1@gmail.com", "fake-email2@gmail.com"],
    };

    it("adds rights to ic user for all agencies in agency group when safir code matches", async () => {
      uow.agencyGroupRepository.agencyGroups = [agencyGroup];
      const icUser: InclusionConnectedUser = {
        ...defaultUser,
        agencyRights: [],
        establishmentDashboards: {},
      };

      uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([icUser]);

      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: icUser.id,
        provider: "inclusionConnect",
        codeSafir: agencyGroupCodeSafir,
      });

      expectToEqual(uow.inclusionConnectedUserRepository.agencyRightsByUserId, {
        [icUser.id]: [
          { agency: agency1InGroup, role: "validator" },
          { agency: agency2InGroup, role: "validator" },
          { agency: agency3InGroup, role: "validator" },
        ],
      });
    });

    it("doesn't override an agency role exept if it's to review", async () => {
      uow.agencyGroupRepository.agencyGroups = [agencyGroup];
      const icUser: InclusionConnectedUser = {
        ...defaultUser,
        agencyRights: [
          { agency: agency1InGroup, role: "counsellor" },
          { agency: agency2InGroup, role: "toReview" },
        ],
        establishmentDashboards: {},
      };

      uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([icUser]);

      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: icUser.id,
        provider: "inclusionConnect",
        codeSafir: agencyGroupCodeSafir,
      });

      expectToEqual(uow.inclusionConnectedUserRepository.agencyRightsByUserId, {
        [icUser.id]: [
          { agency: agency1InGroup, role: "counsellor" },
          { agency: agency2InGroup, role: "validator" },
          { agency: agency3InGroup, role: "validator" },
        ],
      });
    });
  });
});
