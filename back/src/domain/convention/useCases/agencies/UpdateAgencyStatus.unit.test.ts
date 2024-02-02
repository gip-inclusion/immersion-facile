import {
  AgencyDtoBuilder,
  BackOfficeJwtPayload,
  UpdateAgencyStatusParamsWithoutId,
  expectPromiseToFailWithError,
} from "shared";
import {
  InMemoryUnitOfWork,
  createInMemoryUow,
} from "../../../../adapters/primary/config/uowConfig";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../../../../adapters/primary/helpers/httpErrors";
import { InMemoryUowPerformer } from "../../../../adapters/secondary/InMemoryUowPerformer";
import { CustomTimeGateway } from "../../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../../adapters/secondary/core/UuidGeneratorImplementations";
import { makeCreateNewEvent } from "../../../core/eventBus/EventBus";
import { UpdateAgencyStatus } from "./UpdateAgencyStatus";

const nextDate = new Date("2022-01-01T10:00:00.000");
const nextUuid = "event-uuid";
const backofficeJwtPayload: BackOfficeJwtPayload = {
  role: "backOffice",
  iat: 0,
  exp: 0,
  sub: "backoffice-id",
  version: 1,
};

describe("Update agency status", () => {
  let updateAgencyStatus: UpdateAgencyStatus;
  let uow: InMemoryUnitOfWork;

  beforeEach(() => {
    uow = createInMemoryUow();
    const uuidGenerator = new TestUuidGenerator();
    const timeGateway = new CustomTimeGateway();
    timeGateway.setNextDate(nextDate);
    uuidGenerator.setNextUuid(nextUuid);

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
          backofficeJwtPayload,
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

    it("returns 404 if agency not found", async () => {
      const agencyId = "not-found-id";
      await expectPromiseToFailWithError(
        updateAgencyStatus.execute(
          { id: agencyId, status: "active" },
          backofficeJwtPayload,
        ),
        new NotFoundError(`No agency found with id ${agencyId}`),
      );
    });

    it("returns HTTP 409 if attempt to update to another existing agency (with same address and kind, and a status 'active' or 'from-api-PE', (except if user is admin))", async () => {
      const agencyToUpdate = new AgencyDtoBuilder()
        .withId("agency-to-update-id")
        .withStatus("needsReview")
        .withAddress(existingAgency.address)
        .withKind(existingAgency.kind)
        .build();

      uow.agencyRepository.setAgencies([agencyToUpdate, existingAgency]);

      // if user is not admin, conflict error
      await expectPromiseToFailWithError(
        updateAgencyStatus.execute(
          { id: agencyToUpdate.id, status: "active" },
          { role: "another-role" } as any,
        ),
        new ConflictError(
          "Une autre agence du même type existe avec la même adresse",
        ),
      );

      // if user is admin, no conflict error
      const resultWithoutError = await updateAgencyStatus.execute(
        { id: agencyToUpdate.id, status: "active" },
        backofficeJwtPayload,
      );
      expect(resultWithoutError).toBeUndefined();
    });
  });
});
