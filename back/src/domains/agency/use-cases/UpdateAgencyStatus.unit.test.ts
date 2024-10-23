import {
  AgencyDtoBuilder,
  InclusionConnectedUserBuilder,
  UpdateAgencyStatusParamsWithoutId,
  errors,
  expectObjectInArrayToMatch,
  expectPromiseToFailWithError,
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
import { UpdateAgencyStatus } from "./UpdateAgencyStatus";

const nextDate = new Date("2022-01-01T10:00:00.000");
const nextUuid = "event-uuid";

const backofficeAdminBuilder = new InclusionConnectedUserBuilder().withIsAdmin(
  true,
);
const icBackofficeAdmin = backofficeAdminBuilder.build();
const backofficeAdmin = backofficeAdminBuilder.buildUser();

describe("Update agency status", () => {
  let updateAgencyStatus: UpdateAgencyStatus;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uuidGenerator = new TestUuidGenerator();
    const timeGateway = new CustomTimeGateway();
    timeGateway.setNextDate(nextDate);
    uuidGenerator.setNextUuid(nextUuid);

    uow.userRepository.users = [backofficeAdmin];

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
        uow.agencyRepository.setAgencies([toAgencyWithRights(existingAgency)]);

        // Act
        await updateAgencyStatus.execute(
          {
            id: existingAgency.id,
            ...testParams,
          },
          icBackofficeAdmin,
        );

        // Assert
        expect(uow.agencyRepository.agencies[0].status).toBe(
          testParams?.status,
        );
        expectObjectInArrayToMatch(uow.outboxRepository.events, [
          {
            id: nextUuid,
            topic:
              testParams.status === "active"
                ? "AgencyActivated"
                : "AgencyRejected",
            payload: {
              agencyId: existingAgency.id,
              triggeredBy: {
                kind: "inclusion-connected",
                userId: backofficeAdmin.id,
              },
            },
          },
        ]);
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
        errors.user.unauthorized(),
      );
    });

    it("returns Forbbiden if user is not admin", async () => {
      await expectPromiseToFailWithError(
        updateAgencyStatus.execute(
          { id: existingAgency.id, status: "active" },
          { ...icBackofficeAdmin, isBackofficeAdmin: false },
        ),
        errors.user.forbidden({ userId: backofficeAdmin.id }),
      );
    });

    it("returns 404 if agency not found", async () => {
      const agencyId = "not-found-id";
      await expectPromiseToFailWithError(
        updateAgencyStatus.execute(
          { id: agencyId, status: "active" },
          icBackofficeAdmin,
        ),
        errors.agency.notFound({
          agencyId,
        }),
      );
    });
  });
});
