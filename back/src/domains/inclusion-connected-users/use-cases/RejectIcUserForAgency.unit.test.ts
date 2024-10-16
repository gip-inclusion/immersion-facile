import {
  AgencyDtoBuilder,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  User,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
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

const adminBuilder = new InclusionConnectedUserBuilder()
  .withIsAdmin(true)
  .withId("backoffice-admin");
const icAdmin = adminBuilder.build();
const admin = adminBuilder.buildUser();

const notAdminBuilder = new InclusionConnectedUserBuilder().withId(
  "not-an-admin-id",
);
const icNotAdmin = notAdminBuilder.build();
const notAdmin = notAdminBuilder.buildUser();

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
    uow.userRepository.users = [admin];
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
    uow.userRepository.users = [notAdmin];

    await expectPromiseToFailWithError(
      rejectIcUserForAgencyUsecase.execute(
        {
          userId: "osef",
          agencyId: "osef",
          justification: "osef",
        },
        icNotAdmin,
      ),
      errors.user.forbidden({ userId: notAdmin.id }),
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
        icAdmin,
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

    uow.userRepository.users = [icAdmin, icUser];

    await expectPromiseToFailWithError(
      rejectIcUserForAgencyUsecase.execute(
        {
          userId: icUser.id,
          agencyId: agency1.id,
          justification: "osef",
        },
        icAdmin,
      ),
      errors.agency.notFound({ agencyId: agency1.id }),
    );
  });

  it("Remove agency right for IcUser", async () => {
    const now = new Date("2023-11-07");
    timeGateway.setNextDate(now);
    const agency1 = new AgencyDtoBuilder()
      .withValidatorEmails([])
      .withCounsellorEmails([])
      .withId("agency1")
      .build();
    const agency2 = new AgencyDtoBuilder()
      .withValidatorEmails([])
      .withCounsellorEmails([])
      .withId("agency2")
      .build();

    uow.agencyRepository.setAgencies([
      toAgencyWithRights(agency1, {
        [user.id]: { roles: ["to-review"], isNotifiedByEmail: false },
        [notAdmin.id]: { roles: ["validator"], isNotifiedByEmail: false },
      }),
      toAgencyWithRights(agency2, {
        [user.id]: { roles: ["to-review"], isNotifiedByEmail: false },
      }),
    ]);

    uow.userRepository.users = [admin, user];

    await rejectIcUserForAgencyUsecase.execute(
      {
        userId: user.id,
        agencyId: agency1.id,
        justification: "osef",
      },
      icAdmin,
    );

    expectToEqual(uow.agencyRepository.agencies, [
      toAgencyWithRights(agency1, {
        [notAdmin.id]: { roles: ["validator"], isNotifiedByEmail: false },
      }),
      toAgencyWithRights(agency2, {
        [user.id]: { roles: ["to-review"], isNotifiedByEmail: false },
      }),
    ]);

    expectToEqual(uow.outboxRepository.events, [
      {
        id: uuidGenerator.new(),
        occurredAt: now.toISOString(),
        topic: "IcUserAgencyRightRejected",
        payload: {
          userId: user.id,
          agencyId: agency1.id,
          justification: "osef",
          triggeredBy: {
            kind: "inclusion-connected",
            userId: icAdmin.id,
          },
        },
        publications: [],
        status: "never-published",
        wasQuarantined: false,
      },
    ]);
  });
});
