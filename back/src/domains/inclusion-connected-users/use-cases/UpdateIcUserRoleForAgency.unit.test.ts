import {
  AgencyDtoBuilder,
  AgencyRight,
  AgencyRole,
  IcUserRoleForAgencyParams,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
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
import { UpdateIcUserRoleForAgency } from "./UpdateIcUserRoleForAgency";

const backofficeAdminUser = new InclusionConnectedUserBuilder()
  .withId("backoffice-admin-id")
  .withIsAdmin(true)
  .build();

const notAdminUser = new InclusionConnectedUserBuilder()
  .withId("not-admin-id")
  .withIsAdmin(false)
  .build();

describe("GetInclusionConnectedUsers", () => {
  let updateIcUserRoleForAgency: UpdateIcUserRoleForAgency;
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
    updateIcUserRoleForAgency = new UpdateIcUserRoleForAgency(
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
      }),
      errors.user.unauthorized(),
    );
  });

  it("throws Forbidden if token payload is not backoffice token", async () => {
    await expectPromiseToFailWithError(
      updateIcUserRoleForAgency.execute(
        { roles: ["counsellor"], agencyId: "agency-1", userId: "john-123" },
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
        },
        backofficeAdminUser,
      ),
      errors.user.noRightsOnAgency({
        agencyId: agency.id,
        userId: notAdminUser.id,
      }),
    );
  });

  it("changes the role of a user for a given agency", async () => {
    const agency = new AgencyDtoBuilder().build();
    agencyRepository.setAgencies([agency]);
    const icUser: InclusionConnectedUser = {
      ...notAdminUser,
      agencyRights: [{ agency, roles: ["toReview"], isNotifiedByEmail: false }],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    userRepository.setInclusionConnectedUsers([backofficeAdminUser, icUser]);
    const newRole: AgencyRole = "validator";

    await updateIcUserRoleForAgency.execute(
      {
        roles: [newRole],
        agencyId: agency.id,
        userId: notAdminUser.id,
      },
      backofficeAdminUser,
    );

    expectToEqual(await userRepository.getById(notAdminUser.id), {
      ...notAdminUser,
      agencyRights: [{ agency, roles: [newRole], isNotifiedByEmail: false }],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    });
  });

  it("should save IcUserAgencyRightChanged event when successful", async () => {
    const agency = new AgencyDtoBuilder().build();
    agencyRepository.setAgencies([agency]);
    const icUser: InclusionConnectedUser = {
      ...notAdminUser,
      agencyRights: [{ agency, roles: ["toReview"], isNotifiedByEmail: false }],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    userRepository.setInclusionConnectedUsers([backofficeAdminUser, icUser]);
    const newRole: AgencyRole = "validator";
    const icUserRoleForAgency: IcUserRoleForAgencyParams = {
      userId: notAdminUser.id,
      agencyId: agency.id,
      roles: [newRole],
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

  it("can change to more than one role", async () => {
    const agency = new AgencyDtoBuilder()
      .withCounsellorEmails(["fake-email@gmail.com"])
      .build();
    agencyRepository.setAgencies([agency]);
    const icUser: InclusionConnectedUser = {
      ...notAdminUser,
      agencyRights: [{ agency, roles: ["toReview"], isNotifiedByEmail: false }],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    userRepository.setInclusionConnectedUsers([backofficeAdminUser, icUser]);

    const icUserRoleForAgency: IcUserRoleForAgencyParams = {
      roles: ["counsellor", "validator", "agencyOwner"],
      agencyId: agency.id,
      userId: notAdminUser.id,
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

  it("cannot remove the last validator receiving notifications of an agency", async () => {
    const agency = new AgencyDtoBuilder()
      .withCounsellorEmails(["fake-email@gmail.com"])
      .build();
    agencyRepository.setAgencies([agency]);
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
        },
        backofficeAdminUser,
      ),
      errors.agency.notEnoughValidators({ agencyId: agency.id }),
    );
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
        },
        backofficeAdminUser,
      ),
      errors.agency.invalidRoleUpdateForOneStepValidationAgency({
        agencyId: oneStepValidationAgency.id,
        role: "counsellor",
      }),
    );
  });
});
