import {
  AgencyDtoBuilder,
  ConventionDtoBuilder,
  ConventionReadDto,
  InclusionConnectedUserBuilder,
  defaultValidatorEmail,
  errors,
  expectArraysToMatch,
  expectPromiseToFailWithError,
} from "shared";
import { makeCreateNewEvent } from "../../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../../core/unit-of-work/adapters/InMemoryUowPerformer";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import {
  BroadcastConventionAgain,
  makeBroadcastConventionAgain,
} from "./BroadcastConventionAgain";

const adminUser = new InclusionConnectedUserBuilder().withIsAdmin(true).build();
const conventionId = "11111111-1111-4111-1111-111111111111";
const agencyId = "11111111-1111-4111-2222-111111111122";
const agency = new AgencyDtoBuilder().withId(agencyId).build();
const convention = new ConventionDtoBuilder()
  .withId(conventionId)
  .withAgencyId(agencyId)
  .build();

describe("BroadcastConventionAgain", () => {
  let broadcastConventionAgain: BroadcastConventionAgain;
  let uow: InMemoryUnitOfWork;

  beforeEach(async () => {
    uow = createInMemoryUow();
    const uowPerformer = new InMemoryUowPerformer(uow);
    const uuidGenerator = new TestUuidGenerator();
    const timeGateway = new CustomTimeGateway();
    const createNewEvent = makeCreateNewEvent({
      uuidGenerator,
      timeGateway,
    });
    broadcastConventionAgain = makeBroadcastConventionAgain({
      uowPerformer,
      deps: {
        createNewEvent,
      },
    });
    await uow.agencyRepository.insert(
      new AgencyDtoBuilder().withId(agencyId).build(),
    );
    await uow.conventionRepository.save(convention);
  });

  it("throws Forbidden if user is not IF admin", async () => {
    const notAdminUser = new InclusionConnectedUserBuilder()
      .withIsAdmin(false)
      .build();

    await expectPromiseToFailWithError(
      broadcastConventionAgain.execute({ conventionId }, notAdminUser),
      errors.user.forbidden({ userId: notAdminUser.id }),
    );
  });

  it("throws notFound when convention is not found", async () => {
    const notFoundConventionId = "40400000-1111-4000-1111-000000000404";
    await expectPromiseToFailWithError(
      broadcastConventionAgain.execute(
        { conventionId: notFoundConventionId },
        adminUser,
      ),
      errors.convention.notFound({
        conventionId: notFoundConventionId,
      }),
    );
  });

  it("trigger ConventionBroadcastAgain event with the whole convention in payload", async () => {
    await broadcastConventionAgain.execute({ conventionId }, adminUser);

    expect(uow.outboxRepository.events).toHaveLength(1);
    const expectedConventionRead: ConventionReadDto = {
      ...convention,
      agencyId: agency.id,
      agencyKind: agency.kind,
      agencyName: agency.name,
      agencyCounsellorEmails: [],
      agencyValidatorEmails: [defaultValidatorEmail],
      agencySiret: agency.agencySiret,
      agencyDepartment: agency.address.departmentCode,
    };

    expectArraysToMatch(uow.outboxRepository.events, [
      {
        topic: "ConventionBroadcastRequested",
        status: "never-published",
        payload: {
          convention: expectedConventionRead,
          triggeredBy: { kind: "inclusion-connected", userId: adminUser.id },
        },
      },
    ]);
  });
});
