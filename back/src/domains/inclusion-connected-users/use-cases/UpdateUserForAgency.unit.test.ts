import {
  AgencyDto,
  AgencyDtoBuilder,
  AgencyRight,
  AgencyRole,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  User,
  UserParamsForAgency,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { UpdateUserForAgency } from "./UpdateUserForAgency";

describe("UpdateUserForAgency", () => {
  const adminBuilder = new InclusionConnectedUserBuilder()
    .withId("backoffice-admin-id")
    .withIsAdmin(true);
  const icAdmin = adminBuilder.build();
  const adminUser = adminBuilder.buildUser();
  const adminAgencyRights = adminBuilder.buildAgencyRights();

  const notAdminBuilder = new InclusionConnectedUserBuilder()
    .withId("not-admin-id")
    .withIsAdmin(false);
  const icNotAdmin = notAdminBuilder.build();
  const notAdminUser = notAdminBuilder.buildUser();
  const notAdminAgencyRights = notAdminBuilder.buildAgencyRights();

  let updateIcUserRoleForAgency: UpdateUserForAgency;
  let timeGateway: CustomTimeGateway;
  let createNewEvent: CreateNewEvent;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator: new TestUuidGenerator(),
    });

    uow.userRepository.users = [adminUser, notAdminUser];
    updateIcUserRoleForAgency = new UpdateUserForAgency(
      new InMemoryUowPerformer(uow),
      createNewEvent,
    );
  });

  describe("Wrong paths", () => {
    it("throws Forbidden if no jwt payload provided", async () => {
      await expectPromiseToFailWithError(
        updateIcUserRoleForAgency.execute({
          roles: ["counsellor"],
          agencyId: "agency-1",
          userId: icNotAdmin.id,
          isNotifiedByEmail: true,
          email: "notAdminUser@email.fr",
        }),
        errors.user.unauthorized(),
      );
    });

    it("throws Forbidden if token payload is not backoffice token", async () => {
      await expectPromiseToFailWithError(
        updateIcUserRoleForAgency.execute(
          {
            roles: ["counsellor"],
            agencyId: "agency-1",
            userId: "john-123",
            isNotifiedByEmail: true,
            email: "any@email.fr",
          },
          icNotAdmin,
        ),
        errors.user.forbidden({ userId: icNotAdmin.id }),
      );
    });

    it("throws not found if agency does not exist", async () => {
      uow.userRepository.users = [adminUser, notAdminUser];

      const agencyId = "Fake-Agency-Id";

      await expectPromiseToFailWithError(
        updateIcUserRoleForAgency.execute(
          {
            roles: ["counsellor"],
            agencyId,
            userId: notAdminUser.id,
            isNotifiedByEmail: true,
            email: notAdminUser.email,
          },
          icAdmin,
        ),
        errors.agency.notFound({
          agencyId,
        }),
      );
    });

    it("throws forbidden if user has no rights on agency", async () => {
      const agency = new AgencyDtoBuilder().build();
      uow.agencyRepository.setAgencies([agency]);
      uow.userRepository.users = [adminUser, notAdminUser];

      await expectPromiseToFailWithError(
        updateIcUserRoleForAgency.execute(
          {
            roles: ["counsellor"],
            agencyId: agency.id,
            userId: icNotAdmin.id,
            isNotifiedByEmail: true,
            email: "notAdminUser@email.fr",
          },
          icAdmin,
        ),
        errors.user.noRightsOnAgency({
          agencyId: agency.id,
          userId: icNotAdmin.id,
        }),
      );
    });
  });

  describe("when updating email", () => {
    const agency: AgencyDto = new AgencyDtoBuilder()
      .withCounsellorEmails(["fake-email@gmail.com"])
      .build();
    const agencyRight: AgencyRight = {
      agency,
      roles: ["validator"],
      isNotifiedByEmail: true,
    };

    beforeEach(() => {
      uow.agencyRepository.setAgencies([agency]);
    });

    it("throws forbidden if attemps modify email of an inclusion connect user", async () => {
      uow.userRepository.users = [notAdminUser];

      await expectPromiseToFailWithError(
        updateIcUserRoleForAgency.execute(
          {
            agencyId: agency.id,
            roles: ["validator"],
            userId: notAdminUser.id,
            isNotifiedByEmail: true,
            email: "new-email@email.com",
          },
          {
            ...notAdminUser,
            agencyRights: [agencyRight],
            dashboards: {
              agencies: {},
              establishments: {},
            },
          },
        ),
        errors.user.forbiddenToChangeEmailForUIcUser(),
      );
    });

    it("does not modify email if it hasn't changed", async () => {
      uow.userRepository.users = [notAdminUser];
      uow.agencyRepository.setAgencyRights({
        [notAdminUser.id]: [agencyRight],
      });

      await updateIcUserRoleForAgency.execute(
        {
          agencyId: agency.id,
          roles: ["validator"],
          userId: notAdminUser.id,
          isNotifiedByEmail: true,
          email: notAdminUser.email,
        },
        {
          ...notAdminUser,
          externalId: null,
          agencyRights: [agencyRight],
          dashboards: {
            agencies: {},
            establishments: {},
          },
        },
      );

      const updatedUser = await uow.userRepository.getById(notAdminUser.id);
      expectToEqual(updatedUser?.email, notAdminUser.email);
    });

    it("updates the user email for a non ic user", async () => {
      const nonIcUser: InclusionConnectedUser = {
        ...notAdminUser,
        externalId: null,
        agencyRights: [agencyRight],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      };
      uow.userRepository.users = [notAdminUser];
      uow.agencyRepository.setAgencyRights({
        [notAdminUser.id]: [agencyRight],
      });

      await updateIcUserRoleForAgency.execute(
        {
          agencyId: agency.id,
          roles: ["validator"],
          userId: nonIcUser.id,
          isNotifiedByEmail: true,
          email: "new-email@email.com",
        },
        icAdmin,
      );

      const updatedUser = await uow.userRepository.getById(nonIcUser.id);
      expectToEqual(updatedUser?.email, "new-email@email.com");
    });
  });

  describe("when roles are updated", () => {
    it("can change to more than one role", async () => {
      const agency = new AgencyDtoBuilder()
        .withCounsellorEmails(["fake-email@gmail.com"])
        .withValidatorEmails(["validator@gmail.com"])
        .build();
      uow.agencyRepository.setAgencies([agency]);

      const validator: User = {
        ...notAdminUser,
        id: "validator-id",
        email: "validator@email.fr",
      };
      uow.userRepository.users = [adminUser, notAdminUser, validator];
      uow.agencyRepository.setAgencyRights({
        [notAdminUser.id]: [
          { agency, roles: ["to-review"], isNotifiedByEmail: false },
        ],
        [adminUser.id]: adminAgencyRights,
        [validator.id]: [
          { agency, roles: ["validator"], isNotifiedByEmail: true },
        ],
      });

      const newRoles: AgencyRole[] = [
        "counsellor",
        "validator",
        "agency-admin",
      ];
      const icUserRoleForAgency: UserParamsForAgency = {
        roles: newRoles,
        agencyId: agency.id,
        userId: notAdminUser.id,
        isNotifiedByEmail: false,
        email: notAdminUser.email,
      };

      await updateIcUserRoleForAgency.execute(icUserRoleForAgency, icAdmin);

      expectToEqual(
        await uow.userRepository.getById(notAdminUser.id),
        notAdminUser,
      );
      expectToEqual(await uow.agencyRepository.agencyRightsByUserId, {
        [notAdminUser.id]: [
          { agency, roles: newRoles, isNotifiedByEmail: false },
        ],
        [adminUser.id]: adminAgencyRights,
        [validator.id]: [
          { agency, roles: ["validator"], isNotifiedByEmail: true },
        ],
      });

      expectToEqual(uow.outboxRepository.events, [
        createNewEvent({
          topic: "IcUserAgencyRightChanged",
          payload: {
            ...icUserRoleForAgency,
            triggeredBy: {
              kind: "inclusion-connected",
              userId: icAdmin.id,
            },
          },
        }),
      ]);
    });

    it("should save IcUserAgencyRightChanged event when successful", async () => {
      const agency = new AgencyDtoBuilder().build();
      uow.agencyRepository.setAgencies([agency]);
      uow.userRepository.users = [adminUser, notAdminUser];
      uow.agencyRepository.setAgencyRights({
        [notAdminUser.id]: [
          { agency, roles: ["to-review"], isNotifiedByEmail: false },
        ],
      });

      const newRole: AgencyRole = "validator";
      const icUserRoleForAgency: UserParamsForAgency = {
        userId: icNotAdmin.id,
        agencyId: agency.id,
        roles: [newRole],
        isNotifiedByEmail: true,
        email: icNotAdmin.email,
      };

      await updateIcUserRoleForAgency.execute(icUserRoleForAgency, icAdmin);

      expectToEqual(uow.agencyRepository.agencyRightsByUserId, {
        [notAdminUser.id]: [
          { agency, roles: [newRole], isNotifiedByEmail: false },
        ],
      });
      expectToEqual(uow.outboxRepository.events, [
        createNewEvent({
          topic: "IcUserAgencyRightChanged",
          payload: {
            ...icUserRoleForAgency,
            triggeredBy: {
              kind: "inclusion-connected",
              userId: icAdmin.id,
            },
          },
        }),
      ]);
    });

    it("changes the role and email notificatgion of a user for a given agency", async () => {
      const agency = new AgencyDtoBuilder()
        .withValidatorEmails(["icUserWithNotif@email.fr", ""])
        .build();
      uow.agencyRepository.setAgencies([agency]);
      const agencyRight: AgencyRight = {
        agency,
        roles: ["validator"],
        isNotifiedByEmail: true,
      };
      const icUserWithNotif: User = {
        ...icNotAdmin,
        id: "receiving-notif-id",
        email: "icuserwithnotif@email.fr",
      };
      const userToUpdate: User = {
        ...icNotAdmin,
        id: "user-to-update",
        email: "usertoupdate@email.fr",
      };

      uow.userRepository.users = [adminUser, icUserWithNotif, userToUpdate];
      uow.agencyRepository.setAgencyRights({
        [icUserWithNotif.id]: [{ ...agencyRight, isNotifiedByEmail: true }],
        [userToUpdate.id]: [{ ...agencyRight, isNotifiedByEmail: false }],
      });
      const newRole: AgencyRole = "validator";

      await updateIcUserRoleForAgency.execute(
        {
          roles: [newRole],
          agencyId: agency.id,
          userId: userToUpdate.id,
          isNotifiedByEmail: false,
          email: userToUpdate.email,
        },
        icAdmin,
      );

      expectToEqual(uow.userRepository.users, [
        adminUser,
        icUserWithNotif,
        userToUpdate,
      ]);
      expectToEqual(uow.agencyRepository.agencyRightsByUserId, {
        [icUserWithNotif.id]: [{ ...agencyRight, isNotifiedByEmail: true }],
        [userToUpdate.id]: [
          { ...agencyRight, isNotifiedByEmail: false, roles: [newRole] },
        ],
      });
    });

    describe("cannot remove the last validator receiving notifications of an agency", () => {
      const agency: AgencyDto = new AgencyDtoBuilder()
        .withCounsellorEmails(["fake-email@gmail.com"])
        .build();

      beforeEach(() => {
        uow.agencyRepository.setAgencies([agency]);
      });

      it("when last validator role is updated to counsellor", async () => {
        const agencyRightValidatorNotified: AgencyRight = {
          agency,
          roles: ["validator"],
          isNotifiedByEmail: true,
        };

        const userReceivingNotif: User = {
          ...notAdminUser,
        };

        const userWithoutNotif: User = {
          ...notAdminUser,
          id: "not-receiving-notif-id",
        };

        uow.userRepository.users = [
          adminUser,
          userReceivingNotif,
          userWithoutNotif,
        ];
        uow.agencyRepository.setAgencyRights({
          [userReceivingNotif.id]: [agencyRightValidatorNotified],
          [userWithoutNotif.id]: [
            { ...agencyRightValidatorNotified, isNotifiedByEmail: false },
          ],
        });

        await expectPromiseToFailWithError(
          updateIcUserRoleForAgency.execute(
            {
              agencyId: agency.id,
              roles: ["counsellor"],
              userId: userReceivingNotif.id,
              isNotifiedByEmail: true,
              email: userReceivingNotif.email,
            },
            icAdmin,
          ),
          errors.agency.notEnoughValidators({ agencyId: agency.id }),
        );
      });

      it("when last validator role is not notified by email", async () => {
        const user: User = {
          id: "user1",
          email: "user1@email.com",
          createdAt: timeGateway.now().toISOString(),
          externalId: null,
          lastName: "",
          firstName: "",
        };
        uow.userRepository.users = [user];
        uow.agencyRepository.setAgencyRights({
          [user.id]: [
            {
              agency: agency,
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          ],
        });

        await expectPromiseToFailWithError(
          updateIcUserRoleForAgency.execute(
            {
              agencyId: agency.id,
              roles: ["validator"],
              userId: user.id,
              isNotifiedByEmail: false,
              email: user.email,
            },
            icAdmin,
          ),
          errors.agency.notEnoughValidators({ agencyId: agency.id }),
        );
      });
    });

    it("Throw an error when trying to update user Role to counsellor when agency is only one step validation", async () => {
      const oneStepValidationAgency = new AgencyDtoBuilder()
        .withCounsellorEmails([])
        .build();

      uow.agencyRepository.setAgencies([oneStepValidationAgency]);

      const icUserWithRoleValidator = new InclusionConnectedUserBuilder()
        .withId("not-admin-id")
        .withIsAdmin(false)
        .withAgencyRights([
          {
            agency: oneStepValidationAgency,
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
        ])
        .build();

      uow.userRepository.setInclusionConnectedUsers([icUserWithRoleValidator]);

      await expectPromiseToFailWithError(
        updateIcUserRoleForAgency.execute(
          {
            agencyId: oneStepValidationAgency.id,
            roles: ["counsellor"],
            userId: icUserWithRoleValidator.id,
            isNotifiedByEmail: true,
            email: icUserWithRoleValidator.email,
          },
          icAdmin,
        ),
        errors.agency.invalidRoleUpdateForOneStepValidationAgency({
          agencyId: oneStepValidationAgency.id,
          role: "counsellor",
        }),
      );
    });

    describe("cannot remove the last counsellor receiving notifications of an agency with refersTo", () => {
      const user: User = {
        id: "user1",
        email: "user1@email.com",
        createdAt: timeGateway.now().toISOString(),
        externalId: null,
        lastName: "",
        firstName: "",
      };
      const agency: AgencyDto = new AgencyDtoBuilder().build();
      const agencyWithRefersTo: AgencyDto = new AgencyDtoBuilder()
        .withId("agency-with-refers-to")
        .withCounsellorEmails(["user1@email.com"])
        .withRefersToAgencyId(agency.id)
        .build();

      beforeEach(() => {
        uow.agencyRepository.agencies = [agency, agencyWithRefersTo];
        uow.userRepository.users = [user];
      });

      it("when last counsellor role is updated to validator", async () => {
        await uow.userRepository.updateAgencyRights({
          userId: user.id,
          agencyRights: [
            {
              agency: agencyWithRefersTo,
              roles: ["counsellor"],
              isNotifiedByEmail: true,
            },
          ],
        });

        await expectPromiseToFailWithError(
          updateIcUserRoleForAgency.execute(
            {
              agencyId: agencyWithRefersTo.id,
              roles: ["validator"],
              userId: user.id,
              isNotifiedByEmail: false,
              email: user.email,
            },
            icAdmin,
          ),
          errors.agency.notEnoughCounsellors({
            agencyId: agencyWithRefersTo.id,
          }),
        );
      });

      it("when last counsellor role is not notified by email", async () => {
        await uow.userRepository.updateAgencyRights({
          userId: user.id,
          agencyRights: [
            {
              agency: agencyWithRefersTo,
              roles: ["counsellor"],
              isNotifiedByEmail: true,
            },
          ],
        });

        await expectPromiseToFailWithError(
          updateIcUserRoleForAgency.execute(
            {
              agencyId: agencyWithRefersTo.id,
              roles: ["counsellor"],
              userId: user.id,
              isNotifiedByEmail: false,
              email: user.email,
            },
            icAdmin,
          ),
          errors.agency.notEnoughCounsellors({
            agencyId: agencyWithRefersTo.id,
          }),
        );
      });
    });
  });
});
