import {
  AgencyDto,
  AgencyDtoBuilder,
  AgencyRole,
  InclusionConnectedUserBuilder,
  User,
  UserParamsForAgency,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
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

  const notAdminBuilder = new InclusionConnectedUserBuilder()
    .withId("not-admin-id")
    .withIsAdmin(false);
  const icNotAdmin = notAdminBuilder.build();
  const notAdminUser = notAdminBuilder.buildUser();

  const counsellor = new InclusionConnectedUserBuilder()
    .withId("counsellor")
    .withEmail("counsellor@mail.com")
    .buildUser();

  let updateIcUserRoleForAgency: UpdateUserForAgency;
  const timeGateway: CustomTimeGateway = new CustomTimeGateway();
  let createNewEvent: CreateNewEvent;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
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
      uow.agencyRepository.setAgencies([toAgencyWithRights(agency, {})]);
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
    const agency: AgencyDto = new AgencyDtoBuilder().build();

    beforeEach(() => {
      uow.agencyRepository.setAgencies([toAgencyWithRights(agency, {})]);
    });

    it("throws forbidden if attemps modify email of an inclusion connect user", async () => {
      uow.userRepository.users = [notAdminUser];
      uow.agencyRepository.setAgencies([
        toAgencyWithRights(agency, {
          [notAdminUser.id]: { roles: ["validator"], isNotifiedByEmail: true },
        }),
      ]);

      await expectPromiseToFailWithError(
        updateIcUserRoleForAgency.execute(
          {
            agencyId: agency.id,
            roles: ["validator"],
            userId: notAdminUser.id,
            isNotifiedByEmail: true,
            email: "new-email@email.com",
          },
          icAdmin,
        ),
        errors.user.forbiddenToChangeEmailForUIcUser(),
      );
    });

    it("does not modify email if it hasn't changed", async () => {
      uow.userRepository.users = [notAdminUser];
      uow.agencyRepository.setAgencies([
        toAgencyWithRights(agency, {
          [notAdminUser.id]: { roles: ["validator"], isNotifiedByEmail: true },
        }),
      ]);

      await updateIcUserRoleForAgency.execute(
        {
          agencyId: agency.id,
          roles: ["validator"],
          userId: notAdminUser.id,
          isNotifiedByEmail: true,
          email: notAdminUser.email,
        },
        icAdmin,
      );

      const updatedUser = await uow.userRepository.getById(notAdminUser.id);
      expectToEqual(updatedUser?.email, notAdminUser.email);
    });

    it("updates the user email for a non ic user", async () => {
      const nonIcUser: User = {
        ...notAdminUser,
        externalId: null,
      };
      uow.userRepository.users = [nonIcUser];
      uow.agencyRepository.setAgencies([
        toAgencyWithRights(agency, {
          [nonIcUser.id]: { roles: ["validator"], isNotifiedByEmail: true },
        }),
      ]);

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
      const agency = new AgencyDtoBuilder().build();

      const validator: User = {
        ...notAdminUser,
        id: "validator-id",
        email: "validator@email.fr",
      };
      uow.userRepository.users = [
        adminUser,
        notAdminUser,
        validator,
        counsellor,
      ];
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [notAdminUser.id]: { roles: ["to-review"], isNotifiedByEmail: false },
          [validator.id]: { roles: ["validator"], isNotifiedByEmail: true },
          [counsellor.id]: { roles: ["counsellor"], isNotifiedByEmail: false },
        }),
      ];

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

      expectToEqual(uow.userRepository.users, [
        adminUser,
        notAdminUser,
        validator,
        counsellor,
      ]);
      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(agency, {
          [notAdminUser.id]: { roles: newRoles, isNotifiedByEmail: false },
          [validator.id]: { roles: ["validator"], isNotifiedByEmail: true },
          [counsellor.id]: { roles: ["counsellor"], isNotifiedByEmail: false },
        }),
      ]);
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

      uow.userRepository.users = [adminUser, notAdminUser];
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [notAdminUser.id]: { roles: ["to-review"], isNotifiedByEmail: false },
        }),
      ];

      const icUserRoleForAgency: UserParamsForAgency = {
        userId: notAdminUser.id,
        agencyId: agency.id,
        roles: ["validator"],
        isNotifiedByEmail: true,
        email: notAdminUser.email,
      };

      await updateIcUserRoleForAgency.execute(icUserRoleForAgency, icAdmin);

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
      const agency = new AgencyDtoBuilder().build();

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
      uow.agencyRepository.agencies = [
        toAgencyWithRights(agency, {
          [icUserWithNotif.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
          [userToUpdate.id]: { roles: ["validator"], isNotifiedByEmail: false },
        }),
      ];

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
      expectToEqual(uow.agencyRepository.agencies, [
        toAgencyWithRights(agency, {
          [icUserWithNotif.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
          [userToUpdate.id]: { roles: [newRole], isNotifiedByEmail: false },
        }),
      ]);
    });

    it("Throw an error when trying to update user Role to counsellor when agency is only one step validation", async () => {
      const oneStepValidationAgency = new AgencyDtoBuilder().build();

      uow.userRepository.users = [notAdminUser, icAdmin];
      uow.agencyRepository.agencies = [
        toAgencyWithRights(oneStepValidationAgency, {
          [notAdminUser.id]: {
            roles: ["validator"],
            isNotifiedByEmail: true,
          },
        }),
      ];

      await expectPromiseToFailWithError(
        updateIcUserRoleForAgency.execute(
          {
            agencyId: oneStepValidationAgency.id,
            roles: ["counsellor"],
            userId: notAdminUser.id,
            isNotifiedByEmail: true,
            email: notAdminUser.email,
          },
          icAdmin,
        ),
        errors.agency.invalidRoleUpdateForOneStepValidationAgency({
          agencyId: oneStepValidationAgency.id,
          role: "counsellor",
        }),
      );
    });

    describe("cannot remove the last validator receiving notifications of an agency", () => {
      const agencyWithCounsellor: AgencyDto = new AgencyDtoBuilder().build();

      it("when last validator role is updated to counsellor", async () => {
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
          counsellor,
        ];
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agencyWithCounsellor, {
            [userReceivingNotif.id]: {
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
            [userWithoutNotif.id]: {
              roles: ["validator"],
              isNotifiedByEmail: false,
            },
            [counsellor.id]: {
              roles: ["counsellor"],
              isNotifiedByEmail: false,
            },
          }),
        ];

        await expectPromiseToFailWithError(
          updateIcUserRoleForAgency.execute(
            {
              agencyId: agencyWithCounsellor.id,
              roles: ["counsellor"],
              userId: userReceivingNotif.id,
              isNotifiedByEmail: true,
              email: userReceivingNotif.email,
            },
            icAdmin,
          ),
          errors.agency.notEnoughValidators({
            agencyId: agencyWithCounsellor.id,
          }),
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
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agencyWithCounsellor, {
            [user.id]: {
              roles: ["validator"],
              isNotifiedByEmail: true,
            },
          }),
        ];

        await expectPromiseToFailWithError(
          updateIcUserRoleForAgency.execute(
            {
              agencyId: agencyWithCounsellor.id,
              roles: ["validator"],
              userId: user.id,
              isNotifiedByEmail: false,
              email: user.email,
            },
            icAdmin,
          ),
          errors.agency.notEnoughValidators({
            agencyId: agencyWithCounsellor.id,
          }),
        );
      });
    });

    describe("cannot remove the last counsellor receiving notifications of an agency with refersTo", () => {
      const counsellor1: User = {
        id: "user1",
        email: "user1@email.com",
        createdAt: timeGateway.now().toISOString(),
        externalId: null,
        lastName: "",
        firstName: "",
      };
      const counsellor2: User = {
        id: "user2",
        email: "user2@email.com",
        createdAt: timeGateway.now().toISOString(),
        externalId: null,
        lastName: "",
        firstName: "",
      };
      const agency: AgencyDto = new AgencyDtoBuilder().build();
      const agencyWithRefersTo: AgencyDto = new AgencyDtoBuilder()
        .withId("agency-with-refers-to")
        .withRefersToAgencyId(agency.id)
        .build();

      beforeEach(() => {
        uow.userRepository.users = [counsellor1, counsellor2];
      });

      it("when last counsellor role is updated to validator", async () => {
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {}),
          toAgencyWithRights(agencyWithRefersTo, {
            [counsellor1.id]: {
              roles: ["counsellor"],
              isNotifiedByEmail: true,
            },
          }),
        ];

        await expectPromiseToFailWithError(
          updateIcUserRoleForAgency.execute(
            {
              agencyId: agencyWithRefersTo.id,
              roles: ["validator"],
              userId: counsellor1.id,
              isNotifiedByEmail: false,
              email: counsellor1.email,
            },
            icAdmin,
          ),
          errors.agency.notEnoughCounsellors({
            agencyId: agencyWithRefersTo.id,
          }),
        );
      });

      it("when last counsellor role is not notified by email", async () => {
        uow.agencyRepository.agencies = [
          toAgencyWithRights(agency, {}),
          toAgencyWithRights(agencyWithRefersTo, {
            [counsellor1.id]: {
              roles: ["counsellor"],
              isNotifiedByEmail: true,
            },
            [counsellor2.id]: {
              roles: ["counsellor"],
              isNotifiedByEmail: false,
            },
          }),
        ];

        await expectPromiseToFailWithError(
          updateIcUserRoleForAgency.execute(
            {
              agencyId: agencyWithRefersTo.id,
              roles: ["counsellor"],
              userId: counsellor1.id,
              isNotifiedByEmail: false,
              email: counsellor1.email,
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
