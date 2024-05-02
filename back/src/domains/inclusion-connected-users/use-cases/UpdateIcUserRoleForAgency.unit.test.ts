import {
  AgencyDtoBuilder,
  AgencyRole,
  InclusionConnectJwtPayload,
  InclusionConnectedUser,
  InclusionConnectedUserBuilder,
  expectPromiseToFailWith,
  expectToEqual,
} from "shared";
import { InMemoryInclusionConnectedUserRepository } from "../../core/authentication/inclusion-connect/adapters/InMemoryInclusionConnectedUserRepository";
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

const user = new InclusionConnectedUserBuilder()
  .withId("not-admin-id")
  .withIsAdmin(false)
  .build();

describe("GetInclusionConnectedUsers", () => {
  let updateIcUserRoleForAgency: UpdateIcUserRoleForAgency;
  let uowPerformer: InMemoryUowPerformer;
  let inclusionConnectedUserRepository: InMemoryInclusionConnectedUserRepository;
  let timeGateway: CustomTimeGateway;
  let outboxRepo: InMemoryOutboxRepository;
  let createNewEvent: CreateNewEvent;

  beforeEach(() => {
    const uow = createInMemoryUow();

    outboxRepo = uow.outboxRepository;

    timeGateway = new CustomTimeGateway();

    createNewEvent = makeCreateNewEvent({
      timeGateway,
      uuidGenerator: new TestUuidGenerator(),
    });

    inclusionConnectedUserRepository = uow.inclusionConnectedUserRepository;
    uowPerformer = new InMemoryUowPerformer(uow);

    inclusionConnectedUserRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
      user,
    ]);
    updateIcUserRoleForAgency = new UpdateIcUserRoleForAgency(
      uowPerformer,
      createNewEvent,
    );
  });

  it("throws Forbidden if no jwt token provided", async () => {
    await expectPromiseToFailWith(
      updateIcUserRoleForAgency.execute({
        role: "counsellor",
        agencyId: "agency-1",
        userId: user.id,
      }),
      "No JWT token provided",
    );
  });

  it("throws Forbidden if token payload is not backoffice token", async () => {
    await expectPromiseToFailWith(
      updateIcUserRoleForAgency.execute(
        { role: "counsellor", agencyId: "agency-1", userId: "john-123" },
        { userId: user.id },
      ),
      `User '${user.id}' is not a backOffice user`,
    );
  });

  it("throws not found if user does not exist", async () => {
    await expectPromiseToFailWith(
      updateIcUserRoleForAgency.execute(
        {
          role: "counsellor",
          agencyId: "agency-1",
          userId: "john-123",
        },
        { userId: backofficeAdminUser.id } as InclusionConnectJwtPayload,
      ),
      "User with id john-123 not found",
    );
  });

  it("throws not found if agency does not exist for user", async () => {
    inclusionConnectedUserRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
      {
        ...user,
        agencyRights: [],
        dashboards: {
          agencies: {},
          establishments: {},
        },
      },
    ]);

    await expectPromiseToFailWith(
      updateIcUserRoleForAgency.execute(
        {
          role: "counsellor",
          agencyId: "agency-1",
          userId: user.id,
        },
        { userId: backofficeAdminUser.id } as InclusionConnectJwtPayload,
      ),
      `Agency with id agency-1 is not registered for user with id ${user.id}`,
    );
  });

  it("changes the role of a user for a given agency", async () => {
    const agency = new AgencyDtoBuilder().build();
    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [{ agency, role: "toReview", isNotifiedByEmail: false }],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    inclusionConnectedUserRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
      icUser,
    ]);
    const newRole: AgencyRole = "validator";

    await updateIcUserRoleForAgency.execute(
      {
        role: newRole,
        agencyId: agency.id,
        userId: user.id,
      },
      { userId: backofficeAdminUser.id } as InclusionConnectJwtPayload,
    );

    expectToEqual(await inclusionConnectedUserRepository.getById(user.id), {
      ...user,
      agencyRights: [{ agency, role: newRole, isNotifiedByEmail: false }],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    });
  });

  it("should save IcUserAgencyRightChanged event when successful", async () => {
    const agency = new AgencyDtoBuilder().build();
    const icUser: InclusionConnectedUser = {
      ...user,
      agencyRights: [{ agency, role: "toReview", isNotifiedByEmail: false }],
      dashboards: {
        agencies: {},
        establishments: {},
      },
    };

    inclusionConnectedUserRepository.setInclusionConnectedUsers([
      backofficeAdminUser,
      icUser,
    ]);
    const newRole: AgencyRole = "validator";
    const IcUserRoleForAgency = {
      userId: user.id,
      agencyId: agency.id,
      role: newRole,
    };
    await updateIcUserRoleForAgency.execute(IcUserRoleForAgency, {
      userId: backofficeAdminUser.id,
    } as InclusionConnectJwtPayload);

    expect(outboxRepo.events).toHaveLength(1);

    expectToEqual(
      outboxRepo.events[0],
      createNewEvent({
        topic: "IcUserAgencyRightChanged",
        payload: IcUserRoleForAgency,
      }),
    );
  });
});
