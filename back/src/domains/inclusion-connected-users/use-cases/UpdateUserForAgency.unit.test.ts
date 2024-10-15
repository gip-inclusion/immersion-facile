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
import { InMemoryAgencyRepository } from "../../agency/adapters/InMemoryAgencyRepository";
import { InMemoryUserRepository } from "../../core/authentication/inclusion-connect/adapters/InMemoryUserRepository";
import { InMemoryOutboxRepository } from "../../core/events/adapters/InMemoryOutboxRepository";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { UpdateUserForAgency } from "./UpdateUserForAgency";

const backofficeAdminUser = new InclusionConnectedUserBuilder()
  .withId("backoffice-admin-id")
  .withIsAdmin(true)
  .build();

const notAdminUser = new InclusionConnectedUserBuilder()
  .withId("not-admin-id")
  .withIsAdmin(false)
  .build();

describe("UpdateUserForAgency", () => {
  let updateIcUserRoleForAgency: UpdateUserForAgency;
  let uowPerformer: InMemoryUowPerformer;
  let userRepository: InMemoryUserRepository;
  let timeGateway: CustomTimeGateway;
  let outboxRepo: InMemoryOutboxRepository;
  let agencyRepository: InMemoryAgencyRepository;
  let createNewEvent: CreateNewEvent;

  beforeEach(() => {
    const uow = createInMemoryUow();

    outboxRepo = uow.outboxRepository;

    timeGateway = new CustomTimeGateway();

    createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator: new TestUuidGenerator(),
    });

    userRepository = uow.userRepository;
    agencyRepository = uow.agencyRepository;
    uowPerformer = new InMemoryUowPerformer(uow);
    userRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
      notAdminUser,
    ]);
    updateIcUserRoleForAgency = new UpdateUserForAgency(
      uowPerformer,
      createNewEvent,
    );
  });

  it("throws Forbidden if no jwt token provided", async () => {
    await expectPromiseToFailWithError(
      updateIcUserRoleForAgency.execute({
        roles: ["counsellor"],
        agencyId: "agency-1",
        userId: notAdminUser.id,
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
        notAdminUser,
      ),
      errors.user.forbidden({ userId: notAdminUser.id }),
    );
  });

  it("throws not found if agency does not exist", async () => {
    userRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
      {
        ...notAdminUser,
        agencyRights: [],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      },
    ]);

    const agencyId = "Fake-Agency-Id";

    await expectPromiseToFailWithError(
      updateIcUserRoleForAgency.execute(
        {
          roles: ["counsellor"],
          agencyId,
          userId: notAdminUser.id,
          isNotifiedByEmail: true,
          email: "notAdminUser@email.fr",
        },
        backofficeAdminUser,
      ),
      errors.agency.notFound({
        agencyId,
      }),
    );
  });

  it("throws not found if agency does not exist for user", async () => {
    const agency = new AgencyDtoBuilder().build();
    agencyRepository.setAgencies([agency]);
    userRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
      {
        ...notAdminUser,
        agencyRights: [],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      },
    ]);

    await expectPromiseToFailWithError(
      updateIcUserRoleForAgency.execute(
        {
          roles: ["counsellor"],
          agencyId: agency.id,
          userId: notAdminUser.id,
          isNotifiedByEmail: true,
          email: "notAdminUser@email.fr",
        },
        backofficeAdminUser,
      ),
      errors.user.noRightsOnAgency({
        agencyId: agency.id,
        userId: notAdminUser.id,
      }),
    );
  });

  describe("when updating email", () => {
    let agency: AgencyDto;
    let agencyRight: AgencyRight;

    beforeEach(() => {
      agency = new AgencyDtoBuilder()
        .withCounsellorEmails(["fake-email@gmail.com"])
        .build();
      agencyRepository.setAgencies([agency]);
      agencyRight = {
        agency,
        roles: ["validator"],
        isNotifiedByEmail: true,
      };
    });

    it("throws forbidden if attemps modify email of an inclusion connect user", async () => {
      const icUser: InclusionConnectedUser = {
        ...notAdminUser,
        agencyRights: [agencyRight],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      };
      userRepository.setInclusionConnectedUsers([icUser]);

      await expectPromiseToFailWithError(
        updateIcUserRoleForAgency.execute(
          {
            agencyId: agency.id,
            roles: ["validator"],
            userId: icUser.id,
            isNotifiedByEmail: true,
            email: "new-email@email.com",
          },
          backofficeAdminUser,
        ),
        errors.user.forbiddenToChangeEmailForUIcUser(),
      );
    });

    it("does not modify email if it hasn't changed", async () => {
      const icUser: InclusionConnectedUser = {
        ...notAdminUser,
        externalId: null,
        agencyRights: [agencyRight],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      };
      userRepository.setInclusionConnectedUsers([icUser]);

      await updateIcUserRoleForAgency.execute(
        {
          agencyId: agency.id,
          roles: ["validator"],
          userId: icUser.id,
          isNotifiedByEmail: true,
          email: icUser.email,
        },
        backofficeAdminUser,
      );

      const updatedUser = await userRepository.getById(icUser.id);
      expectToEqual(updatedUser?.email, icUser.email);
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
      userRepository.setInclusionConnectedUsers([nonIcUser]);

      await updateIcUserRoleForAgency.execute(
        {
          agencyId: agency.id,
          roles: ["validator"],
          userId: nonIcUser.id,
          isNotifiedByEmail: true,
          email: "new-email@email.com",
        },
        backofficeAdminUser,
      );

      const updatedUser = await userRepository.getById(nonIcUser.id);
      expectToEqual(updatedUser?.email, "new-email@email.com");
    });
  });

  describe("when roles are updated", () => {
    it("can change to more than one role", async () => {
      const agency = new AgencyDtoBuilder()
        .withCounsellorEmails(["fake-email@gmail.com"])
        .withValidatorEmails(["validator@gmail.com"])
        .build();
      agencyRepository.setAgencies([agency]);
      const icUser: InclusionConnectedUser = {
        ...notAdminUser,
        agencyRights: [
          { agency, roles: ["to-review"], isNotifiedByEmail: false },
        ],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      };
      const validator: InclusionConnectedUser = {
        ...notAdminUser,
        id: "validator-id",
        email: "validator@email.fr",
        agencyRights: [
          { agency, roles: ["validator"], isNotifiedByEmail: true },
        ],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      };

      userRepository.setInclusionConnectedUsers([
        backofficeAdminUser,
        icUser,
        validator,
      ]);

      const icUserRoleForAgency: UserParamsForAgency = {
        roles: ["counsellor", "validator", "agency-admin"],
        agencyId: agency.id,
        userId: notAdminUser.id,
        isNotifiedByEmail: false,
        email: notAdminUser.email,
      };

      await updateIcUserRoleForAgency.execute(
        icUserRoleForAgency,
        backofficeAdminUser,
      );

      expectToEqual(await userRepository.getById(notAdminUser.id), {
        ...notAdminUser,
        agencyRights: [
          {
            agency,
            roles: icUserRoleForAgency.roles,
            isNotifiedByEmail: false,
          },
        ],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      });

      expect(outboxRepo.events).toHaveLength(1);

      expectToEqual(
        outboxRepo.events[0],
        createNewEvent({
          topic: "IcUserAgencyRightChanged",
          payload: {
            ...icUserRoleForAgency,
            triggeredBy: {
              kind: "inclusion-connected",
              userId: backofficeAdminUser.id,
            },
          },
        }),
      );
    });

    it("should save IcUserAgencyRightChanged event when successful", async () => {
      const agency = new AgencyDtoBuilder().build();
      agencyRepository.setAgencies([agency]);
      const icUser: InclusionConnectedUser = {
        ...notAdminUser,
        agencyRights: [
          { agency, roles: ["to-review"], isNotifiedByEmail: false },
        ],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      };

      userRepository.setInclusionConnectedUsers([backofficeAdminUser, icUser]);
      const newRole: AgencyRole = "validator";
      const icUserRoleForAgency: UserParamsForAgency = {
        userId: notAdminUser.id,
        agencyId: agency.id,
        roles: [newRole],
        isNotifiedByEmail: true,
        email: notAdminUser.email,
      };
      await updateIcUserRoleForAgency.execute(
        icUserRoleForAgency,
        backofficeAdminUser,
      );

      expect(outboxRepo.events).toHaveLength(1);

      expectToEqual(
        outboxRepo.events[0],
        createNewEvent({
          topic: "IcUserAgencyRightChanged",
          payload: {
            ...icUserRoleForAgency,
            triggeredBy: {
              kind: "inclusion-connected",
              userId: backofficeAdminUser.id,
            },
          },
        }),
      );
    });

    it("changes the role of a user for a given agency", async () => {
      const agency = new AgencyDtoBuilder()
        .withValidatorEmails(["icUserWithNotif@email.fr", ""])
        .build();
      agencyRepository.setAgencies([agency]);
      const agencyRight: AgencyRight = {
        agency,
        roles: ["validator"],
        isNotifiedByEmail: true,
      };
      const icUserWithNotif: InclusionConnectedUser = {
        ...notAdminUser,
        id: "receiving-notif-id",
        email: "icuserwithnotif@email.fr",
        agencyRights: [{ ...agencyRight, isNotifiedByEmail: true }],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      };
      const userToUpdate: InclusionConnectedUser = {
        ...notAdminUser,
        id: "user-to-update",
        email: "usertoupdate@email.fr",
        agencyRights: [{ ...agencyRight, isNotifiedByEmail: false }],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      };

      userRepository.setInclusionConnectedUsers([
        backofficeAdminUser,
        icUserWithNotif,
        userToUpdate,
      ]);
      const newRole: AgencyRole = "validator";

      await updateIcUserRoleForAgency.execute(
        {
          roles: [newRole],
          agencyId: agency.id,
          userId: userToUpdate.id,
          isNotifiedByEmail: false,
          email: userToUpdate.email,
        },
        backofficeAdminUser,
      );

      expectToEqual(await userRepository.getById(userToUpdate.id), {
        ...userToUpdate,
        agencyRights: [
          { ...agencyRight, isNotifiedByEmail: false, roles: [newRole] },
        ],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      });
    });

    describe("cannot remove the last validator receiving notifications of an agency", () => {
      let agency: AgencyDto;

      beforeEach(() => {
        agency = new AgencyDtoBuilder()
          .withCounsellorEmails(["fake-email@gmail.com"])
          .build();
        agencyRepository.setAgencies([agency]);
      });

      it("when last validator role is updated to counsellor", async () => {
        const agencyRight: AgencyRight = {
          agency,
          roles: ["validator"],
          isNotifiedByEmail: true,
        };

        const icUserReceivingNotif: InclusionConnectedUser = {
          ...notAdminUser,
          agencyRights: [agencyRight],
          dashboards: {
            agencies: {},
            establishments: {},
          },
        };

        const icUserWithoutNotif: InclusionConnectedUser = {
          ...notAdminUser,
          id: "not-receiving-notif-id",
          agencyRights: [{ ...agencyRight, isNotifiedByEmail: false }],
          dashboards: {
            agencies: {},
            establishments: {},
          },
        };

        userRepository.setInclusionConnectedUsers([
          backofficeAdminUser,
          icUserReceivingNotif,
          icUserWithoutNotif,
        ]);

        await expectPromiseToFailWithError(
          updateIcUserRoleForAgency.execute(
            {
              agencyId: agency.id,
              roles: ["counsellor"],
              userId: icUserReceivingNotif.id,
              isNotifiedByEmail: true,
              email: icUserReceivingNotif.email,
            },
            backofficeAdminUser,
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
        userRepository.users = [user];

        await userRepository.updateAgencyRights({
          userId: user.id,
          agencyRights: [
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
            backofficeAdminUser,
          ),
          errors.agency.notEnoughValidators({ agencyId: agency.id }),
        );
      });
    });

    it("Throw an error when trying to update user Role to counsellor when agency is only one step validation", async () => {
      const oneStepValidationAgency = new AgencyDtoBuilder()
        .withCounsellorEmails([])
        .build();

      agencyRepository.setAgencies([oneStepValidationAgency]);

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

      userRepository.setInclusionConnectedUsers([icUserWithRoleValidator]);

      await expectPromiseToFailWithError(
        updateIcUserRoleForAgency.execute(
          {
            agencyId: oneStepValidationAgency.id,
            roles: ["counsellor"],
            userId: icUserWithRoleValidator.id,
            isNotifiedByEmail: true,
            email: icUserWithRoleValidator.email,
          },
          backofficeAdminUser,
        ),
        errors.agency.invalidRoleUpdateForOneStepValidationAgency({
          agencyId: oneStepValidationAgency.id,
          role: "counsellor",
        }),
      );
    });

    describe("cannot remove the last counsellor receiving notifications of an agency with refersTo", () => {
      let user: User;
      let agency: AgencyDto;
      let agencyWithRefersTo: AgencyDto;

      beforeEach(() => {
        agency = new AgencyDtoBuilder().build();
        agencyWithRefersTo = new AgencyDtoBuilder()
          .withId("agency-with-refers-to")
          .withCounsellorEmails(["user1@email.com"])
          .withRefersToAgencyInfo({
            refersToAgencyId: agency.id,
            refersToAgencyName: agency.name,
          })
          .build();
        user = {
          id: "user1",
          email: "user1@email.com",
          createdAt: timeGateway.now().toISOString(),
          externalId: null,
          lastName: "",
          firstName: "",
        };

        agencyRepository.agencies = [agency, agencyWithRefersTo];
        userRepository.users = [user];
      });

      it("when last counsellor role is updated to validator", async () => {
        await userRepository.updateAgencyRights({
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
            backofficeAdminUser,
          ),
          errors.agency.notEnoughCounsellors({
            agencyId: agencyWithRefersTo.id,
          }),
        );
      });

      it("when last counsellor role is not notified by email", async () => {
        await userRepository.updateAgencyRights({
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
            backofficeAdminUser,
          ),
          errors.agency.notEnoughCounsellors({
            agencyId: agencyWithRefersTo.id,
          }),
        );
      });
    });
  });
});
