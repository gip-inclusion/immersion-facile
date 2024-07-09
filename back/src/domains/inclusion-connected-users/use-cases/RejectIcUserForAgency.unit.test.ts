import {
  AgencyDtoBuilder,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  User,
  errorMessages,
  expectPromiseToFailWith,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import {
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../../config/helpers/httpErrors";
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
      agencyRights: [
        { agency: agency1, roles: ["toReview"], isNotifiedByEmail: false },
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
      new UnauthorizedError(),
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

    await expectPromiseToFailWithError(
      rejectIcUserForAgencyUsecase.execute(
        {
          userId: "osef",
          agencyId: "osef",
          justification: "osef",
        },
        currentUser,
      ),
      new ForbiddenError(
        errorMessages.user.forbidden({ userId: currentUser.id }),
      ),
    );
  });

  it("Throw when no icUser were found", async () => {
    const agency1 = new AgencyDtoBuilder().withId("agency1").build();

    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [
        { agency: agency1, roles: ["toReview"], isNotifiedByEmail: false },
      ],
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
        backofficeAdminUser,
      ),
      `No user found with id: ${icUser.id}`,
    );
  });

  it("Throw when no agency were found", async () => {
    const agency1 = new AgencyDtoBuilder().withId("agency1").build();

    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [
        { agency: agency1, roles: ["toReview"], isNotifiedByEmail: false },
      ],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
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
      new NotFoundError(
        errorMessages.agency.notFound({ agencyId: agency1.id }),
      ),
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
        { agency: agency1, roles: ["toReview"], isNotifiedByEmail: false },
        { agency: agency2, roles: ["toReview"], isNotifiedByEmail: false },
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
      backofficeAdminUser,
    );

    expectToEqual(uow.inclusionConnectedUserRepository.agencyRightsByUserId, {
      [icUser.id]: [
        { agency: agency2, roles: ["toReview"], isNotifiedByEmail: false },
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
