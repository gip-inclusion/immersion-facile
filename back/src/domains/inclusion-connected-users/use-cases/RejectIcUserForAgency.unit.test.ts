import {
  AgencyDtoBuilder,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  User,
  errors,
  expectPromiseToFailWithError,
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

const backofficeAdminUser = new InclusionConnectedUserBuilder()
  .withIsAdmin(true)
  .withId("backoffice-admin")
  .build();

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
    uow.userRepository.setInclusionConnectedUsers([backofficeAdminUser]);
    rejectIcUserForAgencyUsecase = new RejectIcUserForAgency(
      uowPerformer,
      createNewEvent,
    );
  });

  it("throws when no jwt token provided", async () => {
    const agency1 = new AgencyDtoBuilder().withId("agency1").build();

    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [
        { agency: agency1, roles: ["to-review"], isNotifiedByEmail: false },
      ],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    await expectPromiseToFailWithError(
      rejectIcUserForAgencyUsecase.execute({
        userId: icUser.id,
        agencyId: agency1.id,
        justification: "osef",
      }),
      errors.user.unauthorized(),
    );
  });

  it("Throws if current user is not a backoffice admin", async () => {
    const currentUser = {
      ...backofficeAdminUser,
      id: "not-an-admin-id",
      isBackofficeAdmin: false,
    };

    uow.userRepository.setInclusionConnectedUsers([currentUser]);

    await expectPromiseToFailWithError(
      rejectIcUserForAgencyUsecase.execute(
        {
          userId: "osef",
          agencyId: "osef",
          justification: "osef",
        },
        currentUser,
      ),
      errors.user.forbidden({ userId: currentUser.id }),
    );
  });

  it("Throw when no icUser were found", async () => {
    const agency1 = new AgencyDtoBuilder().withId("agency1").build();

    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [
        { agency: agency1, roles: ["to-review"], isNotifiedByEmail: false },
      ],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    await expectPromiseToFailWithError(
      rejectIcUserForAgencyUsecase.execute(
        {
          userId: icUser.id,
          agencyId: agency1.id,
          justification: "osef",
        },
        backofficeAdminUser,
      ),
      errors.user.notFound({ userId: icUser.id }),
    );
  });

  it("Throw when no agency were found", async () => {
    const agency1 = new AgencyDtoBuilder().withId("agency1").build();

    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [
        { agency: agency1, roles: ["to-review"], isNotifiedByEmail: false },
      ],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    uow.userRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
      icUser,
    ]);

    await expectPromiseToFailWithError(
      rejectIcUserForAgencyUsecase.execute(
        {
          userId: icUser.id,
          agencyId: agency1.id,
          justification: "osef",
        },
        backofficeAdminUser,
      ),
      errors.agency.notFound({ agencyId: agency1.id }),
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
        { agency: agency1, roles: ["to-review"], isNotifiedByEmail: false },
        { agency: agency2, roles: ["to-review"], isNotifiedByEmail: false },
      ],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    uow.agencyRepository.setAgencies([agency1, agency2]);

    uow.userRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
      icUser,
    ]);

    await rejectIcUserForAgencyUsecase.execute(
      {
        userId: icUser.id,
        agencyId: agency1.id,
        justification: "osef",
      },
      backofficeAdminUser,
    );

    expectToEqual(uow.userRepository.agencyRightsByUserId, {
      [icUser.id]: [
        { agency: agency2, roles: ["to-review"], isNotifiedByEmail: false },
      ],
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
          triggeredBy: {
            kind: "inclusion-connected",
            userId: backofficeAdminUser.id,
          },
        },
        publications: [],
        status: "never-published",
        wasQuarantined: false,
      },
    ]);
  });
});
