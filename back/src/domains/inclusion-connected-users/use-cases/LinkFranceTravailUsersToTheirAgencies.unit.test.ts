import {
  AgencyDtoBuilder,
  AgencyGroup,
  InclusionConnectedUser,
  User,
  expectToEqual,
} from "shared";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
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

const defaultUser: User = {
  id: "my-user-id",
  firstName: "John",
  lastName: "Doe",
  externalId: "my-external-id",
  email: "john.doe@inclusion.com",
  createdAt: new Date().toISOString(),
};

describe("LinkFranceTravailUsersToTheirAgencies", () => {
  let uow: InMemoryUnitOfWork;
  let linkFranceTravailUsersToTheirAgencies: LinkFranceTravailUsersToTheirAgencies;

  beforeEach(() => {
    uow = createInMemoryUow();
    linkFranceTravailUsersToTheirAgencies =
      new LinkFranceTravailUsersToTheirAgencies(new InMemoryUowPerformer(uow));
    uow.userRepository.users = [defaultUser];
    uow.agencyRepository.setAgencies(agenciesInRepo);
  });

  describe("when no safir code is provided", () => {
    it("does nothing", async () => {
      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: "my-user-id",
        provider: "inclusionConnect",
        codeSafir: null,
      });

      expectToEqual(uow.userRepository.users, [defaultUser]);
      expectToEqual(uow.userRepository.agencyRightsByUserId, {});
    });
  });

  describe("when safir code is provided", () => {
    it("add agency right to IC user if user has no rights on agency", async () => {
      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: "my-user-id",
        provider: "inclusionConnect",
        codeSafir: codeSafir,
      });

      expectToEqual(uow.userRepository.agencyRightsByUserId, {
        [defaultUser.id]: [
          { agency, roles: ["validator"], isNotifiedByEmail: false },
        ],
      });
    });

    it("don't add agency right to IC user if user already has rights on agency", async () => {
      const icUser: InclusionConnectedUser = {
        ...defaultUser,
        agencyRights: [
          { agency, roles: ["agencyAdmin"], isNotifiedByEmail: false },
        ],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      };

      uow.userRepository.setInclusionConnectedUsers([icUser]);

      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: "my-user-id",
        provider: "inclusionConnect",
        codeSafir: codeSafir,
      });

      expectToEqual(uow.userRepository.agencyRightsByUserId, {
        [icUser.id]: [
          { agency, roles: ["agencyAdmin"], isNotifiedByEmail: false },
        ],
      });
    });

    it("replace agency right to IC user if user already has rights on agency and current right is toReview", async () => {
      const icUser: InclusionConnectedUser = {
        ...defaultUser,
        agencyRights: [
          { agency, roles: ["toReview"], isNotifiedByEmail: false },
        ],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      };

      uow.userRepository.setInclusionConnectedUsers([icUser]);

      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: "my-user-id",
        provider: "inclusionConnect",
        codeSafir: codeSafir,
      });

      expectToEqual(uow.userRepository.agencyRightsByUserId, {
        [icUser.id]: [
          { agency, roles: ["validator"], isNotifiedByEmail: false },
        ],
      });
    });

    it("don't add agency right to IC user if there is no agency with this code safir", async () => {
      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: "my-user-id",
        provider: "inclusionConnect",
        codeSafir: "not-existing-code-safir",
      });

      expectToEqual(uow.userRepository.agencyRightsByUserId, {});
    });

    it("don't add agency right to IC user if agency is closed or rejected", async () => {
      const closedAgency = new AgencyDtoBuilder()
        .withId("agency-id-3")
        .withCodeSafir("agency-safir-4")
        .withStatus("closed")
        .build();

      const rejectedAgency = new AgencyDtoBuilder()
        .withId("agency-id-4")
        .withCodeSafir("agency-safir-5")
        .withStatus("rejected")
        .build();
      uow.agencyRepository.setAgencies([
        ...agenciesInRepo,
        closedAgency,
        rejectedAgency,
      ]);

      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: "my-user-id",
        provider: "inclusionConnect",
        codeSafir: "agency-safir-4",
      });
      expectToEqual(uow.userRepository.agencyRightsByUserId, {});

      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: "my-user-id",
        provider: "inclusionConnect",
        codeSafir: "agency-safir-5",
      });
      expectToEqual(uow.userRepository.agencyRightsByUserId, {});
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
        dashboards: {
          agencies: {},
          establishments: {},
        },
      };

      uow.userRepository.setInclusionConnectedUsers([icUser]);

      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: icUser.id,
        provider: "inclusionConnect",
        codeSafir: agencyGroupCodeSafir,
      });

      expectToEqual(uow.userRepository.agencyRightsByUserId, {
        [icUser.id]: [
          {
            agency: agency1InGroup,
            roles: ["agency-viewer"],
            isNotifiedByEmail: false,
          },
          {
            agency: agency2InGroup,
            roles: ["agency-viewer"],
            isNotifiedByEmail: false,
          },
          {
            agency: agency3InGroup,
            roles: ["agency-viewer"],
            isNotifiedByEmail: false,
          },
        ],
      });
    });

    it("doesn't override an agency role except if it's to review", async () => {
      uow.agencyGroupRepository.agencyGroups = [agencyGroup];
      const icUser: InclusionConnectedUser = {
        ...defaultUser,
        agencyRights: [
          {
            agency: agency1InGroup,
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
          {
            agency: agency2InGroup,
            roles: ["toReview"],
            isNotifiedByEmail: false,
          },
        ],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      };

      uow.userRepository.setInclusionConnectedUsers([icUser]);

      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: icUser.id,
        provider: "inclusionConnect",
        codeSafir: agencyGroupCodeSafir,
      });

      expectToEqual(uow.userRepository.agencyRightsByUserId, {
        [icUser.id]: [
          {
            agency: agency1InGroup,
            roles: ["validator"],
            isNotifiedByEmail: false,
          },
          {
            agency: agency2InGroup,
            roles: ["agency-viewer"],
            isNotifiedByEmail: false,
          },
          {
            agency: agency3InGroup,
            roles: ["agency-viewer"],
            isNotifiedByEmail: false,
          },
        ],
      });
    });

    it("don't add agency right to IC user if agency is closed or rejected", async () => {
      const closedAgency = new AgencyDtoBuilder()
        .withId("agency-id-3")
        .withCodeSafir("agency-safir-4")
        .withStatus("closed")
        .build();

      const rejectedAgency = new AgencyDtoBuilder()
        .withId("agency-id-4")
        .withCodeSafir("agency-safir-5")
        .withStatus("rejected")
        .build();
      uow.agencyRepository.setAgencies([
        ...agenciesInRepo,
        closedAgency,
        rejectedAgency,
      ]);
      const agencyGroupWithClosedAndRejectedAgencies: AgencyGroup = {
        siret: "12345678902345",
        kind: "france-travail",
        email: "agency-group-1-email@gmail.com",
        codeSafir: agencyGroupCodeSafir,
        departments: ["87", "23", "19"],
        name: "DR du limousin",
        scope: "direction-régionale",
        agencyIds: [closedAgency.id, rejectedAgency.id],
        ccEmails: ["fake-email1@gmail.com", "fake-email2@gmail.com"],
      };
      uow.agencyGroupRepository.agencyGroups = [
        agencyGroupWithClosedAndRejectedAgencies,
      ];
      const icUser: InclusionConnectedUser = {
        ...defaultUser,
        agencyRights: [],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      };
      uow.userRepository.setInclusionConnectedUsers([icUser]);

      await linkFranceTravailUsersToTheirAgencies.execute({
        userId: icUser.id,
        provider: "inclusionConnect",
        codeSafir: agencyGroupCodeSafir,
      });

      expectToEqual(uow.userRepository.agencyRightsByUserId, {
        [icUser.id]: [],
      });
    });
  });
});
