import {
  AgencyDtoBuilder,
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
const agency = new AgencyDtoBuilder().withCodeSafir(codeSafir).build();

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
    uow.agencyRepository.setAgencies([agency]);
  });

  describe("when no safir code is provided", () => {
    it("does nothing", async () => {
      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: "my-user-id",
        provider: "inclusionConnect",
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
});
