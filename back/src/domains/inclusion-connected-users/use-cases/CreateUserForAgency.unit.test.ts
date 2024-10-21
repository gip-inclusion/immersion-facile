import {
  AgencyDtoBuilder,
  InclusionConnectedUserBuilder,
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
import { TimeGateway } from "../../core/time-gateway/ports/TimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { UuidGenerator } from "../../core/uuid-generator/ports/UuidGenerator";
import {
  CreateUserForAgency,
  makeCreateUserForAgency,
} from "./CreateUserForAgency";

const backofficeAdminUser = new InclusionConnectedUserBuilder()
  .withId("backoffice-admin-id")
  .withIsAdmin(true)
  .build();

const notAdminUser = new InclusionConnectedUserBuilder()
  .withId("not-admin-id")
  .withIsAdmin(false)
  .build();

const agency = new AgencyDtoBuilder()
  .withCounsellorEmails(["fake-email@gmail.com"])
  .build();

describe("CreateUserForAgency", () => {
  let createUserForAgency: CreateUserForAgency;
  let uowPerformer: InMemoryUowPerformer;
  let userRepository: InMemoryUserRepository;
  let agencyRepository: InMemoryAgencyRepository;
  let timeGateway: TimeGateway;
  let uuidGenerator: UuidGenerator;
  let outboxRepository: InMemoryOutboxRepository;
  let createNewEvent: CreateNewEvent;

  beforeEach(() => {
    const uow = createInMemoryUow();

    userRepository = uow.userRepository;
    agencyRepository = uow.agencyRepository;
    outboxRepository = uow.outboxRepository;
    uowPerformer = new InMemoryUowPerformer(uow);
    userRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
      notAdminUser,
    ]);
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    createNewEvent = makeCreateNewEvent({
      uuidGenerator,
      timeGateway,
    });
    createUserForAgency = makeCreateUserForAgency({
      uowPerformer,
      deps: { timeGateway, createNewEvent },
    });
    agencyRepository.setAgencies([agency]);
  });

  it("throws Forbidden if token payload is not backoffice token", async () => {
    await expectPromiseToFailWithError(
      createUserForAgency.execute(
        {
          userId: uuidGenerator.new(),
          roles: ["counsellor"],
          agencyId: "agency-1",
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
      createUserForAgency.execute(
        {
          userId: uuidGenerator.new(),
          roles: ["counsellor"],
          agencyId,
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

  describe("Agency with refers to agency", () => {
    const agencyWithRefersTo = new AgencyDtoBuilder()
      .withId("agency-with-refers-to")
      .withCounsellorEmails(["fake-counsellor-email@gmail.com"])
      .withRefersToAgencyInfo({
        refersToAgencyId: agency.id,
        refersToAgencyName: agency.name,
      })
      .build();

    it("Throw when user have role validator", async () => {
      agencyRepository.insert(agencyWithRefersTo);

      expectPromiseToFailWithError(
        createUserForAgency.execute(
          {
            userId: uuidGenerator.new(),
            agencyId: agencyWithRefersTo.id,
            roles: ["validator"],
            isNotifiedByEmail: true,
            email: "new-user@email.fr",
          },
          backofficeAdminUser,
        ),
        errors.agency.invalidRoleUpdateForAgencyWithRefersTo({
          agencyId: agencyWithRefersTo.id,
          role: "validator",
        }),
      );
    });
  });

  it("create new user with its agency rights", async () => {
    const newUserId = uuidGenerator.new();
    userRepository.users = [];

    const icUserForAgency: UserParamsForAgency = {
      userId: newUserId,
      agencyId: agency.id,
      roles: ["counsellor"],
      isNotifiedByEmail: false,
      email: "new-user@email.fr",
    };

    await createUserForAgency.execute(icUserForAgency, backofficeAdminUser);

    expect(userRepository.users.length).toBe(1);
    expectToEqual(await userRepository.getById(newUserId), {
      createdAt: timeGateway.now().toISOString(),
      externalId: null,
      firstName: "",
      id: newUserId,
      email: "new-user@email.fr",
      lastName: "",
      agencyRights: [
        { agency, isNotifiedByEmail: false, roles: ["counsellor"] },
      ],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    });

    expectToEqual(outboxRepository.events, [
      createNewEvent({
        topic: "IcUserAgencyRightChanged",
        payload: {
          ...icUserForAgency,
          triggeredBy: {
            kind: "inclusion-connected",
            userId: backofficeAdminUser.id,
          },
        },
      }),
    ]);
  });

  it("add agency rights to an existing user", async () => {
    const anotherAgency = new AgencyDtoBuilder()
      .withId("another-agency-id")
      .build();
    await agencyRepository.insert(anotherAgency);
    const userId = uuidGenerator.new();
    await userRepository.save({
      id: userId,
      email: "user@email.fr",
      firstName: "John",
      lastName: "Doe",
      externalId: null,
      createdAt: timeGateway.now().toISOString(),
    });
    await userRepository.updateAgencyRights({
      userId,
      agencyRights: [
        {
          agency,
          isNotifiedByEmail: true,
          roles: ["validator"],
        },
      ],
    });

    const icUserForAgency: UserParamsForAgency = {
      userId,
      agencyId: anotherAgency.id,
      roles: ["counsellor"],
      isNotifiedByEmail: false,
      email: "user@email.fr",
    };

    await createUserForAgency.execute(icUserForAgency, backofficeAdminUser);

    expectToEqual(await userRepository.getById(userId), {
      createdAt: timeGateway.now().toISOString(),
      externalId: null,
      firstName: "John",
      id: userId,
      email: "user@email.fr",
      lastName: "Doe",
      agencyRights: [
        {
          agency,
          isNotifiedByEmail: true,
          roles: ["validator"],
        },
        {
          agency: anotherAgency,
          isNotifiedByEmail: false,
          roles: ["counsellor"],
        },
      ],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    });
    expectToEqual(outboxRepository.events, [
      createNewEvent({
        topic: "IcUserAgencyRightChanged",
        payload: {
          ...icUserForAgency,
          triggeredBy: {
            kind: "inclusion-connected",
            userId: backofficeAdminUser.id,
          },
        },
      }),
    ]);
  });
});
