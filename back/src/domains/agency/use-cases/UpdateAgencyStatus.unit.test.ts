import {
  AgencyDtoBuilder,
  InclusionConnectedUserBuilder,
  UpdateAgencyStatusParamsWithoutId,
  expectPromiseToFailWithError,
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
import { UpdateAgencyStatus } from "./UpdateAgencyStatus";

const nextDate = new Date("2022-01-01T10:00:00.000");
const nextUuid = "event-uuid";

const backofficeAdmin = new InclusionConnectedUserBuilder()
  .withIsAdmin(true)
  .build();

describe("Update agency status", () => {
  let updateAgencyStatus: UpdateAgencyStatus;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uuidGenerator = new TestUuidGenerator();
    const timeGateway = new CustomTimeGateway();
    timeGateway.setNextDate(nextDate);
    uuidGenerator.setNextUuid(nextUuid);

    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers([
      backofficeAdmin,
    ]);

    const createNewEvent = makeCreateNewEvent({
      uuidGenerator,
      timeGateway,
    });

    updateAgencyStatus = new UpdateAgencyStatus(
      new InMemoryUowPerformer(uow),
      createNewEvent,
    );
  });

  describe("right path", () => {
    const existingAgency = AgencyDtoBuilder.create("agency-123")
      .withStatus("needsReview")
      .build();

    it.each([
      { status: "active" },
      { status: "rejected", rejectionJustification: "justification" },
    ] satisfies UpdateAgencyStatusParamsWithoutId[])(
      "Updates an agency status in repository and publishes an event to notify if status becomes $status",
      async (testParams) => {
        // Prepare
        uow.agencyRepository.setAgencies([existingAgency]);

        // Act
        await updateAgencyStatus.execute(
          {
            id: existingAgency.id,
            ...testParams,
          },
          backofficeAdmin,
        );

        // Assert
        expect(uow.agencyRepository.agencies[0].status).toBe(
          testParams?.status,
        );
        expect(uow.outboxRepository.events[0]).toMatchObject({
          id: nextUuid,
          topic:
            testParams.status === "active"
              ? "AgencyActivated"
              : "AgencyRejected",
          payload: { agency: { ...existingAgency, ...testParams } },
        });
      },
    );
  });

  describe("wrong paths", () => {
    const existingAgency = AgencyDtoBuilder.create("agency-123")
      .withStatus("active")
      .build();

    it("returns 401 if no jwt payload", async () => {
      await expectPromiseToFailWithError(
        updateAgencyStatus.execute(
          { id: existingAgency.id, status: "active" },
          undefined,
        ),
        new UnauthorizedError(),
      );
    });

    it("returns Forbbiden if user is not admin", async () => {
      await expectPromiseToFailWithError(
        updateAgencyStatus.execute(
          { id: existingAgency.id, status: "active" },
          { ...backofficeAdmin, isBackofficeAdmin: false },
        ),
        new ForbiddenError("Insufficient privileges for this user"),
      );
    });

    it("returns 404 if agency not found", async () => {
      const agencyId = "not-found-id";
      await expectPromiseToFailWithError(
        updateAgencyStatus.execute(
          { id: agencyId, status: "active" },
          backofficeAdmin,
        ),
        new NotFoundError(`No agency found with id ${agencyId}`),
      );
    });
  });
});
