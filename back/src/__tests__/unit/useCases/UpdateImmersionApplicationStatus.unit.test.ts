import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../../adapters/primary/helpers/sendHttpResponse";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import {
  CreateNewEvent,
  makeCreateNewEvent,
} from "../../../domain/core/eventBus/EventBus";
import { DomainEvent, DomainTopic } from "../../../domain/core/eventBus/events";
import { OutboxRepository } from "../../../domain/core/ports/OutboxRepository";
import { ImmersionApplicationEntity } from "../../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { UpdateImmersionApplicationStatus } from "../../../domain/immersionApplication/useCases/UpdateImmersionApplicationStatus";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
} from "../../../shared/ImmersionApplicationDto";
import {
  createMagicLinkPayload,
  Role,
} from "../../../shared/tokens/MagicLinkPayload";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";

describe("UpdateImmersionApplicationStatus", () => {
  let updateImmersionApplicationStatus: UpdateImmersionApplicationStatus;
  let outboxRepository: OutboxRepository;
  let immersionApplicationRepository: InMemoryImmersionApplicationRepository;

  let createNewEvent: CreateNewEvent;

  beforeEach(() => {
    immersionApplicationRepository =
      new InMemoryImmersionApplicationRepository();
    outboxRepository = new InMemoryOutboxRepository();
    createNewEvent = makeCreateNewEvent({
      clock: new CustomClock(),
      uuidGenerator: new TestUuidGenerator(),
    });

    updateImmersionApplicationStatus = new UpdateImmersionApplicationStatus(
      immersionApplicationRepository,
      createNewEvent,
      outboxRepository,
    );
  });

  describe("IN_REVIEW -> ACCEPTED_BY_COUNSELLOR transition", () => {
    test("accepted from counsellor", () =>
      testAcceptsStatusUpdate({
        role: "counsellor",
        oldStatus: "IN_REVIEW",
        newStatus: "ACCEPTED_BY_COUNSELLOR",
        expectedDomainTopic: "ImmersionApplicationAcceptedByCounsellor",
      }));
    test("rejected from validator", () =>
      testRejectsStatusUpdate({
        role: "validator",
        oldStatus: "IN_REVIEW",
        newStatus: "ACCEPTED_BY_COUNSELLOR",
        expectedError: new ForbiddenError(),
      }));
    test("rejected from admin", () =>
      testRejectsStatusUpdate({
        role: "admin",
        oldStatus: "IN_REVIEW",
        newStatus: "ACCEPTED_BY_COUNSELLOR",
        expectedError: new ForbiddenError(),
      }));
  });

  describe("IN_REVIEW -> REJECTED transition", () => {
    test("accepted from counsellor", () =>
      testAcceptsStatusUpdate({
        role: "counsellor",
        oldStatus: "IN_REVIEW",
        newStatus: "REJECTED",
        expectedDomainTopic: undefined, // No event expected.
      }));
    test("accepted from validator", () =>
      testAcceptsStatusUpdate({
        role: "validator",
        oldStatus: "IN_REVIEW",
        newStatus: "REJECTED",
        expectedDomainTopic: undefined, // No event expected.
      }));
    test("accepted from admin", () =>
      testAcceptsStatusUpdate({
        role: "admin",
        oldStatus: "IN_REVIEW",
        newStatus: "REJECTED",
        expectedDomainTopic: undefined, // No event expected.
      }));
  });

  describe("ACCEPTED_BY_COUNSELLOR -> ACCEPTED_BY_VALIDATOR transition", () => {
    test("rejected from counsellor", () =>
      testRejectsStatusUpdate({
        role: "counsellor",
        oldStatus: "ACCEPTED_BY_COUNSELLOR",
        newStatus: "ACCEPTED_BY_VALIDATOR",
        expectedError: new ForbiddenError(),
      }));
    test("accepted from validator", () =>
      testAcceptsStatusUpdate({
        role: "validator",
        oldStatus: "ACCEPTED_BY_COUNSELLOR",
        newStatus: "ACCEPTED_BY_VALIDATOR",
        expectedDomainTopic: "ImmersionApplicationAcceptedByValidator",
      }));
    test("rejected from admin", () =>
      testRejectsStatusUpdate({
        role: "admin",
        oldStatus: "ACCEPTED_BY_COUNSELLOR",
        newStatus: "ACCEPTED_BY_VALIDATOR",
        expectedError: new ForbiddenError(),
      }));
  });

  describe("ACCEPTED_BY_COUNSELLOR -> REJECTED transition", () => {
    test("accepted from counsellor", () =>
      testAcceptsStatusUpdate({
        role: "counsellor",
        oldStatus: "ACCEPTED_BY_COUNSELLOR",
        newStatus: "REJECTED",
        expectedDomainTopic: undefined, // No event expected.
      }));
    test("accepted from validator", () =>
      testAcceptsStatusUpdate({
        role: "validator",
        oldStatus: "ACCEPTED_BY_COUNSELLOR",
        newStatus: "REJECTED",
        expectedDomainTopic: undefined, // No event expected.
      }));
    test("accepted from admin", () =>
      testAcceptsStatusUpdate({
        role: "admin",
        oldStatus: "ACCEPTED_BY_COUNSELLOR",
        newStatus: "REJECTED",
        expectedDomainTopic: undefined, // No event expected.
      }));
  });

  describe("ACCEPTED_BY_VALIDATOR -> VALIDATED transition", () => {
    test("rejected from counsellor", () =>
      testRejectsStatusUpdate({
        role: "counsellor",
        oldStatus: "ACCEPTED_BY_VALIDATOR",
        newStatus: "VALIDATED",
        expectedError: new ForbiddenError(),
      }));
    test("rejected from validator", () =>
      testRejectsStatusUpdate({
        role: "validator",
        oldStatus: "ACCEPTED_BY_VALIDATOR",
        newStatus: "VALIDATED",
        expectedError: new ForbiddenError(),
      }));
    test("accepted from admin", () =>
      testAcceptsStatusUpdate({
        role: "admin",
        oldStatus: "ACCEPTED_BY_VALIDATOR",
        newStatus: "VALIDATED",
        expectedDomainTopic: "FinalImmersionApplicationValidationByAdmin",
      }));
  });

  describe("ACCEPTED_BY_VALIDATOR -> REJECTED transition", () => {
    test("accepted from counsellor", () =>
      testAcceptsStatusUpdate({
        role: "counsellor",
        oldStatus: "ACCEPTED_BY_VALIDATOR",
        newStatus: "REJECTED",
        expectedDomainTopic: undefined, // No event expected.
      }));
    test("accepted from validator", () =>
      testAcceptsStatusUpdate({
        role: "validator",
        oldStatus: "ACCEPTED_BY_VALIDATOR",
        newStatus: "REJECTED",
        expectedDomainTopic: undefined, // No event expected.
      }));
    test("accepted from admin", () =>
      testAcceptsStatusUpdate({
        role: "admin",
        oldStatus: "ACCEPTED_BY_VALIDATOR",
        newStatus: "REJECTED",
        expectedDomainTopic: undefined, // No event expected.
      }));
  });

  test("rejects invalid transition source status", () =>
    testRejectsStatusUpdate({
      role: "counsellor",
      oldStatus: "VALIDATED",
      newStatus: "ACCEPTED_BY_COUNSELLOR",
      expectedError: new BadRequestError("ACCEPTED_BY_COUNSELLOR"),
    }));
  test("rejects invalid transition target status", () =>
    testRejectsStatusUpdate({
      role: "counsellor",
      oldStatus: "ACCEPTED_BY_VALIDATOR",
      newStatus: "ACCEPTED_BY_COUNSELLOR",
      expectedError: new BadRequestError("ACCEPTED_BY_COUNSELLOR"),
    }));
  test("fails for unknown application ids", () =>
    expectPromiseToFailWithError(
      executeUseCase({
        applicationId: "unknown_application_id",
        role: "admin",
        newStatus: "VALIDATED",
      }),
      new NotFoundError("unknown_application_id"),
    ));

  // Test helpers.

  type SetupInitialStateParams = {
    oldStatus: ApplicationStatus;
  };
  const setupInitialState = async ({
    oldStatus,
  }: SetupInitialStateParams): Promise<ImmersionApplicationDto> => {
    const originalImmersionApplication = new ImmersionApplicationDtoBuilder()
      .withStatus(oldStatus)
      .build();
    await immersionApplicationRepository.save(
      ImmersionApplicationEntity.create(originalImmersionApplication),
    );
    return originalImmersionApplication;
  };

  type ExecuteUseCaseParams = {
    applicationId: string;
    role: Role;
    newStatus: ApplicationStatus;
  };
  const executeUseCase = async ({
    applicationId,
    role,
    newStatus,
  }: ExecuteUseCaseParams): Promise<ImmersionApplicationDto> => {
    const response = await updateImmersionApplicationStatus.execute(
      { status: newStatus },
      createMagicLinkPayload(applicationId, role),
    );
    expect(response.id).toEqual(applicationId);
    const storedImmersionApplication =
      await immersionApplicationRepository.getById(applicationId);
    return storedImmersionApplication.toDto();
  };

  type TestAcceptNewStatusParams = {
    role: Role;
    oldStatus: ApplicationStatus;
    newStatus: ApplicationStatus;
    expectedDomainTopic?: DomainTopic;
  };
  const testAcceptsStatusUpdate = async ({
    role,
    oldStatus,
    newStatus,
    expectedDomainTopic,
  }: TestAcceptNewStatusParams) => {
    const originalImmersionApplication = await setupInitialState({ oldStatus });
    const storedImmersionApplication = await executeUseCase({
      applicationId: originalImmersionApplication.id,
      role,
      newStatus,
    });

    const expectedImmersionApplication: ImmersionApplicationDto = {
      ...originalImmersionApplication,
      status: newStatus,
    };
    expect(storedImmersionApplication).toEqual(expectedImmersionApplication);

    const allEvents = await outboxRepository.getAllUnpublishedEvents();
    if (expectedDomainTopic) {
      const expectedEvent: Partial<DomainEvent> = {
        topic: expectedDomainTopic,
        payload: expectedImmersionApplication,
      };
      expect(allEvents).toHaveLength(1);
      expect(allEvents[0]).toMatchObject(expectedEvent);
    } else {
      expect(allEvents).toHaveLength(0);
    }
  };

  type TestRejectsNewStatusParams = {
    role: Role;
    oldStatus: ApplicationStatus;
    newStatus: ApplicationStatus;
    expectedError: UnauthorizedError | BadRequestError;
  };
  const testRejectsStatusUpdate = async ({
    role,
    oldStatus,
    newStatus,
    expectedError,
  }: TestRejectsNewStatusParams) => {
    const originalImmersionApplication = await setupInitialState({ oldStatus });
    await expectPromiseToFailWithError(
      executeUseCase({
        applicationId: originalImmersionApplication.id,
        role,
        newStatus,
      }),
      expectedError,
    );
  };
});
