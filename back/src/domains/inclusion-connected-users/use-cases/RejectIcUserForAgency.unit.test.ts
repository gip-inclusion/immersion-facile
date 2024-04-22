import {
  AgencyDtoBuilder,
  InclusionConnectJwtPayload,
  InclusionConnectedUser,
  User,
  expectPromiseToFailWith,
  expectToEqual,
} from "shared";
import { makeCreateNewEvent } from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { RejectIcUserForAgency } from "./RejectIcUserForAgency";

const user: User = {
  id: "john-123",
  email: "john@mail.com",
  firstName: "John",
  lastName: "Lennon",
  externalId: "john-external-id",
  createdAt: new Date().toISOString(),
};

const backofficeAdminUser: InclusionConnectedUser = {
  id: "backoffice-admin",
  email: "jack.admin@mail.com",
  firstName: "Jack",
  lastName: "The Admin",
  externalId: "jack-admin-external-id",
  createdAt: new Date().toISOString(),
  isBackofficeAdmin: true,
  agencyRights: [],
  dashboards: { agencies: {}, establishments: {} },
  establishments: [],
};

const backofficeAdminJwtPayload = {
  userId: backofficeAdminUser.id,
} as InclusionConnectJwtPayload;

describe("reject IcUser for agency", () => {
  let uow: InMemoryUnitOfWork;
  let rejectIcUserForAgencyUsecase: RejectIcUserForAgency;
  let uuidGenerator: TestUuidGenerator;
  let timeGateway: CustomTimeGateway;

  beforeEach(() => {
    uow = createInMemoryUow();
    timeGateway = new CustomTimeGateway();
    uuidGenerator = new TestUuidGenerator();
    const createNewEvent = makeCreateNewEvent({ timeGateway, uuidGenerator });
    const uowPerformer = new InMemoryUowPerformer(uow);
    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
    ]);
    rejectIcUserForAgencyUsecase = new RejectIcUserForAgency(
      uowPerformer,
      createNewEvent,
    );
  });

  it("throws when no jwt token provided", async () => {
    const agency1 = new AgencyDtoBuilder().withId("agency1").build();

    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [{ agency: agency1, role: "toReview" }],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    await expectPromiseToFailWith(
      rejectIcUserForAgencyUsecase.execute({
        userId: icUser.id,
        agencyId: agency1.id,
        justification: "osef",
      }),
      "No JWT token provided",
    );
  });

  it("Throws if current user is not a backoffice admin", async () => {
    const currentUser = {
      ...backofficeAdminUser,
      id: "not-an-admin-id",
      isBackofficeAdmin: false,
    };

    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      currentUser,
    ]);

    await expectPromiseToFailWith(
      rejectIcUserForAgencyUsecase.execute(
        {
          userId: "osef",
          agencyId: "osef",
          justification: "osef",
        },
        { userId: currentUser.id } as InclusionConnectJwtPayload,
      ),
      "User 'not-an-admin-id' is not a backOffice user",
    );
  });

  it("Throw when no icUser were found", async () => {
    const agency1 = new AgencyDtoBuilder().withId("agency1").build();

    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [{ agency: agency1, role: "toReview" }],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    await expectPromiseToFailWith(
      rejectIcUserForAgencyUsecase.execute(
        {
          userId: icUser.id,
          agencyId: agency1.id,
          justification: "osef",
        },
        backofficeAdminJwtPayload,
      ),
      `No user found with id: ${icUser.id}`,
    );
  });

  it("Throw when no agency were found", async () => {
    const agency1 = new AgencyDtoBuilder().withId("agency1").build();

    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [{ agency: agency1, role: "toReview" }],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
      icUser,
    ]);

    await expectPromiseToFailWith(
      rejectIcUserForAgencyUsecase.execute(
        {
          userId: icUser.id,
          agencyId: agency1.id,
          justification: "osef",
        },
        backofficeAdminJwtPayload,
      ),
      `No agency found with id: ${agency1.id}`,
    );
  });

  it("Throw when wrong jwt were provided", async () => {
    const agency1 = new AgencyDtoBuilder().withId("agency1").build();

    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [{ agency: agency1, role: "toReview" }],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    const randomUser: InclusionConnectedUser = {
      ...backofficeAdminUser,
      isBackofficeAdmin: false,
      id: "random-user-id",
    };

    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      randomUser,
    ]);

    await expectPromiseToFailWith(
      rejectIcUserForAgencyUsecase.execute(
        {
          userId: icUser.id,
          agencyId: agency1.id,
          justification: "osef",
        },
        { userId: randomUser.id } as InclusionConnectJwtPayload,
      ),
      `User '${randomUser.id}' is not a backOffice user`,
    );
  });

  it("Remove agency right for IcUser", async () => {
    const now = new Date("2023-11-07");
    timeGateway.setNextDate(now);
    const agency1 = new AgencyDtoBuilder().withId("agency1").build();
    const agency2 = new AgencyDtoBuilder().withId("agency2").build();

    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [
        { agency: agency1, role: "toReview" },
        { agency: agency2, role: "toReview" },
      ],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    uow.agencyRepository.setAgencies([agency1, agency2]);

    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
      icUser,
    ]);

    await rejectIcUserForAgencyUsecase.execute(
      {
        userId: icUser.id,
        agencyId: agency1.id,
        justification: "osef",
      },
      backofficeAdminJwtPayload,
    );

    expectToEqual(uow.inclusionConnectedUserRepository.agencyRightsByUserId, {
      [icUser.id]: [{ agency: agency2, role: "toReview" }],
      [backofficeAdminUser.id]: [],
    });

    expectToEqual(uow.outboxRepository.events, [
      {
        id: uuidGenerator.new(),
        occurredAt: now.toISOString(),
        topic: "IcUserAgencyRightRejected",
        payload: {
          userId: icUser.id,
          agencyId: agency1.id,
          justification: "osef",
        },
        publications: [],
        status: "never-published",
        wasQuarantined: false,
      },
    ]);
  });
});
