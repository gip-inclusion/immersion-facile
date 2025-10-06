import {
  AgencyDtoBuilder,
  ConnectedUserBuilder,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import {
  createInMemoryUow,
  type InMemoryUnitOfWork,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { AssignAgencyViewerRole } from "./AssignAgencyViewerRoleToUsers";

describe("AssignAgencyViewerRoleToUsers", () => {
  let uow: InMemoryUnitOfWork;
  let assignAgencyViewerRole: AssignAgencyViewerRole;

  const user1 = new ConnectedUserBuilder()
    .withId("user1")
    .withEmail("user1@example.com")
    .buildUser();

  const user2 = new ConnectedUserBuilder()
    .withId("user2")
    .withEmail("user2@example.com")
    .buildUser();

  const user3 = new ConnectedUserBuilder()
    .withId("user3")
    .withEmail("user3@example.com")
    .buildUser();

  const poleEmploiAgency1 = toAgencyWithRights(
    new AgencyDtoBuilder()
      .withId("pe-agency-1")
      .withKind("pole-emploi")
      .withStatus("active")
      .withName("PE Agency 1")
      .build(),
  );

  const poleEmploiAgency2 = toAgencyWithRights(
    new AgencyDtoBuilder()
      .withId("pe-agency-2")
      .withKind("pole-emploi")
      .withStatus("active")
      .withName("PE Agency 2")
      .build(),
  );

  const capEmploiAgency = toAgencyWithRights(
    new AgencyDtoBuilder()
      .withId("cap-agency-1")
      .withKind("cap-emploi")
      .withStatus("active")
      .withName("Cap Emploi Agency")
      .build(),
  );

  const conseilDepartementalAgency = toAgencyWithRights(
    new AgencyDtoBuilder()
      .withId("cd-agency-1")
      .withKind("conseil-departemental")
      .withStatus("active")
      .withName("Conseil Départemental Agency")
      .build(),
  );

  const inactiveAgency = toAgencyWithRights(
    new AgencyDtoBuilder()
      .withId("inactive-agency")
      .withKind("pole-emploi")
      .withStatus("needsReview")
      .withName("Inactive Agency")
      .build(),
  );

  const fromApiPEAgency = toAgencyWithRights(
    new AgencyDtoBuilder()
      .withId("from-api-pe-agency")
      .withKind("pole-emploi")
      .withStatus("from-api-PE")
      .withName("From API PE Agency")
      .build(),
  );

  const poleEmploiAgencyWithUser1ViewerRole = toAgencyWithRights(
    new AgencyDtoBuilder()
      .withId("pe-agency-with-user1-viewer")
      .withKind("pole-emploi")
      .withStatus("active")
      .withName("PE Agency with User1 Viewer Role")
      .build(),
    {
      [user1.id]: {
        roles: ["agency-viewer"],
        isNotifiedByEmail: false,
      },
    },
  );

  const poleEmploiAgencyWithUser1AdminRole = toAgencyWithRights(
    new AgencyDtoBuilder()
      .withId("pe-agency-with-user1-admin")
      .withKind("pole-emploi")
      .withStatus("active")
      .withName("PE Agency with User1 Admin Role")
      .build(),
    {
      [user1.id]: {
        roles: ["agency-admin"],
        isNotifiedByEmail: true,
      },
    },
  );

  const user1ViewerRights = {
    [user1.id]: {
      roles: ["agency-viewer"],
      isNotifiedByEmail: false,
    },
  };

  const user2ViewerRights = {
    [user2.id]: {
      roles: ["agency-viewer"],
      isNotifiedByEmail: false,
    },
  };

  beforeEach(() => {
    uow = createInMemoryUow();
    assignAgencyViewerRole = new AssignAgencyViewerRole(
      new InMemoryUowPerformer(uow),
    );

    uow.agencyRepository.agencies = [
      poleEmploiAgency1,
      poleEmploiAgency2,
      capEmploiAgency,
      conseilDepartementalAgency,
      inactiveAgency,
      fromApiPEAgency,
      poleEmploiAgencyWithUser1ViewerRole,
      poleEmploiAgencyWithUser1AdminRole,
    ];

    uow.userRepository.users = [user1, user2, user3];
  });

  describe("when users exist and agencies are available", () => {
    it("should assign agency viewer role to users for specified agency kinds", async () => {
      expectToEqual(
        await assignAgencyViewerRole.execute({
          userIds: [user1.id, user2.id],
          agencyKinds: ["pole-emploi", "cap-emploi"],
        }),
        {
          agenciesSuccessfullyUpdated: 6,
          agencyUpdatesFailed: 0,
          agenciesSkipped: 0,
        },
      );

      expectToEqual(uow.agencyRepository.agencies, [
        {
          ...poleEmploiAgency1,
          usersRights: {
            ...user1ViewerRights,
            ...user2ViewerRights,
          },
        },
        {
          ...poleEmploiAgency2,
          usersRights: {
            ...user1ViewerRights,
            ...user2ViewerRights,
          },
        },
        {
          ...capEmploiAgency,
          usersRights: {
            ...user1ViewerRights,
            ...user2ViewerRights,
          },
        },
        conseilDepartementalAgency,
        inactiveAgency,
        {
          ...fromApiPEAgency,
          usersRights: {
            ...user1ViewerRights,
            ...user2ViewerRights,
          },
        },
        {
          ...poleEmploiAgencyWithUser1ViewerRole,
          usersRights: {
            ...user1ViewerRights,
            ...user2ViewerRights,
          },
        },
        {
          ...poleEmploiAgencyWithUser1AdminRole,
          usersRights: {
            [user1.id]: {
              roles: ["agency-admin", "agency-viewer"],
              isNotifiedByEmail: true,
            },
            ...user2ViewerRights,
          },
        },
      ]);
    });

    it("should only process active and from-api-PE agencies", async () => {
      const result = await assignAgencyViewerRole.execute({
        userIds: [user1.id],
        agencyKinds: ["pole-emploi"],
      });

      expectToEqual(result, {
        agenciesSuccessfullyUpdated: 4,
        agencyUpdatesFailed: 0,
        agenciesSkipped: 1,
      });

      expectToEqual(uow.agencyRepository.agencies, [
        {
          ...poleEmploiAgency1,
          usersRights: user1ViewerRights,
        },
        {
          ...poleEmploiAgency2,
          usersRights: user1ViewerRights,
        },
        capEmploiAgency,
        conseilDepartementalAgency,
        inactiveAgency,
        {
          ...fromApiPEAgency,
          usersRights: user1ViewerRights,
        },
        {
          ...poleEmploiAgencyWithUser1ViewerRole,
          usersRights: user1ViewerRights,
        },
        {
          ...poleEmploiAgencyWithUser1AdminRole,
          usersRights: {
            [user1.id]: {
              roles: ["agency-admin", "agency-viewer"],
              isNotifiedByEmail: true,
            },
          },
        },
      ]);
    });

    it("should not assign roles to agencies where user already has viewer role", async () => {
      const result = await assignAgencyViewerRole.execute({
        userIds: [user1.id],
        agencyKinds: ["pole-emploi"],
      });

      expectToEqual(result, {
        agenciesSuccessfullyUpdated: 4,
        agencyUpdatesFailed: 0,
        agenciesSkipped: 1,
      });

      expectToEqual(uow.agencyRepository.agencies, [
        {
          ...poleEmploiAgency1,
          usersRights: user1ViewerRights,
        },
        {
          ...poleEmploiAgency2,
          usersRights: user1ViewerRights,
        },
        capEmploiAgency,
        conseilDepartementalAgency,
        inactiveAgency,
        {
          ...fromApiPEAgency,
          usersRights: user1ViewerRights,
        },
        {
          ...poleEmploiAgencyWithUser1ViewerRole,
          usersRights: user1ViewerRights,
        },
        {
          ...poleEmploiAgencyWithUser1AdminRole,
          usersRights: {
            [user1.id]: {
              roles: ["agency-admin", "agency-viewer"],
              isNotifiedByEmail: true,
            },
          },
        },
      ]);
    });

    it("should add agency-viewer role to existing roles when user has other roles", async () => {
      const result = await assignAgencyViewerRole.execute({
        userIds: [user1.id],
        agencyKinds: ["pole-emploi"],
      });

      expectToEqual(result, {
        agenciesSuccessfullyUpdated: 4,
        agencyUpdatesFailed: 0,
        agenciesSkipped: 1,
      });

      expectToEqual(uow.agencyRepository.agencies, [
        {
          ...poleEmploiAgency1,
          usersRights: user1ViewerRights,
        },
        {
          ...poleEmploiAgency2,
          usersRights: user1ViewerRights,
        },
        capEmploiAgency,
        conseilDepartementalAgency,
        inactiveAgency,
        {
          ...fromApiPEAgency,
          usersRights: user1ViewerRights,
        },
        {
          ...poleEmploiAgencyWithUser1ViewerRole,
          usersRights: user1ViewerRights,
        },
        {
          ...poleEmploiAgencyWithUser1AdminRole,
          usersRights: {
            [user1.id]: {
              roles: ["agency-admin", "agency-viewer"],
              isNotifiedByEmail: true,
            },
          },
        },
      ]);
    });

    it("should handle multiple agency kinds", async () => {
      const result = await assignAgencyViewerRole.execute({
        userIds: [user1.id],
        agencyKinds: ["pole-emploi", "cap-emploi", "conseil-departemental"],
      });

      expectToEqual(result, {
        agenciesSuccessfullyUpdated: 6,
        agencyUpdatesFailed: 0,
        agenciesSkipped: 1,
      });

      expectToEqual(uow.agencyRepository.agencies, [
        {
          ...poleEmploiAgency1,
          usersRights: user1ViewerRights,
        },
        {
          ...poleEmploiAgency2,
          usersRights: user1ViewerRights,
        },
        {
          ...capEmploiAgency,
          usersRights: user1ViewerRights,
        },
        {
          ...conseilDepartementalAgency,
          usersRights: user1ViewerRights,
        },
        inactiveAgency,
        {
          ...fromApiPEAgency,
          usersRights: user1ViewerRights,
        },
        {
          ...poleEmploiAgencyWithUser1ViewerRole,
          usersRights: user1ViewerRights,
        },
        {
          ...poleEmploiAgencyWithUser1AdminRole,
          usersRights: {
            [user1.id]: {
              roles: ["agency-admin", "agency-viewer"],
              isNotifiedByEmail: true,
            },
          },
        },
      ]);
    });
  });

  describe("when users do not exist", () => {
    it("should throw error for non-existent users", async () => {
      await expectPromiseToFailWithError(
        assignAgencyViewerRole.execute({
          userIds: ["non-existent-user"],
          agencyKinds: ["pole-emploi"],
        }),
        errors.users.notFound({ userIds: ["non-existent-user"] }),
      );
    });
  });

  describe("when no agencies match the criteria", () => {
    it("should return zero processed rights when no agencies match kinds", async () => {
      const result = await assignAgencyViewerRole.execute({
        userIds: [user1.id],
        agencyKinds: ["autre"],
      });

      expectToEqual(result, {
        agenciesSuccessfullyUpdated: 0,
        agencyUpdatesFailed: 0,
        agenciesSkipped: 0,
      });
    });
  });
});
