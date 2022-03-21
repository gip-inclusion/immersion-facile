import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import {
  CreateNewEvent,
  makeCreateNewEvent,
  NarrowEvent,
} from "../../../domain/core/eventBus/EventBus";
import { DomainTopic } from "../../../domain/core/eventBus/events";
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

  describe("READY_TO_SIGN -> REJECTED transition", () => {
    test("admin can reject applications that are READY_TO_SIGN", () =>
      testAcceptsStatusUpdate({
        role: "admin",
        oldStatus: "READY_TO_SIGN",
        newStatus: "REJECTED",
        expectedDomainTopic: "ImmersionApplicationRejected",
      }));
  });

  describe("PARTIALLY_SIGNED -> REJECTED transition", () => {
    test("admin can reject applications that are PARTIALLY_SIGNED", () =>
      testAcceptsStatusUpdate({
        role: "admin",
        oldStatus: "PARTIALLY_SIGNED",
        newStatus: "REJECTED",
        expectedDomainTopic: "ImmersionApplicationRejected",
      }));
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
      testAcceptsStatusUpdateToRejected({
        role: "counsellor",
        oldStatus: "IN_REVIEW",
      }));
    test("accepted from validator", () =>
      testAcceptsStatusUpdateToRejected({
        role: "validator",
        oldStatus: "IN_REVIEW",
      }));
    test("accepted from admin", () =>
      testAcceptsStatusUpdateToRejected({
        role: "admin",
        oldStatus: "IN_REVIEW",
      }));
  });

  describe("* -> DRAFT transition", () => {
    const validOldStatuses: ApplicationStatus[] = [
      "IN_REVIEW",
      "ACCEPTED_BY_VALIDATOR",
      "ACCEPTED_BY_COUNSELLOR",
    ];
    const validRoles: Role[] = ["counsellor", "validator", "admin"];

    for (const status of validOldStatuses) {
      for (const role of validRoles) {
        test("accepted from " + role, () =>
          testAcceptsStatusUpdateToDraftAndInvalidatesSignatures({
            role: role,
            oldStatus: status,
          }),
        );
      }
    }
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
      testAcceptsStatusUpdateToRejected({
        role: "counsellor",
        oldStatus: "ACCEPTED_BY_COUNSELLOR",
      }));
    test("accepted from validator", () =>
      testAcceptsStatusUpdateToRejected({
        role: "validator",
        oldStatus: "ACCEPTED_BY_COUNSELLOR",
      }));
    test("accepted from admin", () =>
      testAcceptsStatusUpdateToRejected({
        role: "admin",
        oldStatus: "ACCEPTED_BY_COUNSELLOR",
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
      testAcceptsStatusUpdateToRejected({
        role: "counsellor",
        oldStatus: "ACCEPTED_BY_VALIDATOR",
      }));
    test("accepted from validator", () =>
      testAcceptsStatusUpdateToRejected({
        role: "validator",
        oldStatus: "ACCEPTED_BY_VALIDATOR",
      }));
    test("accepted from admin", () =>
      testAcceptsStatusUpdateToRejected({
        role: "admin",
        oldStatus: "ACCEPTED_BY_VALIDATOR",
      }));
  });

  test("rejects invalid transition source status", () =>
    testRejectsStatusUpdate({
      role: "counsellor",
      oldStatus: "VALIDATED",
      newStatus: "ACCEPTED_BY_COUNSELLOR",
      expectedError: new BadRequestError(
        "Cannot go from status 'VALIDATED' to 'ACCEPTED_BY_COUNSELLOR'",
      ),
    }));
  test("rejects invalid transition target status", () =>
    testRejectsStatusUpdate({
      role: "counsellor",
      oldStatus: "ACCEPTED_BY_VALIDATOR",
      newStatus: "ACCEPTED_BY_COUNSELLOR",
      expectedError: new BadRequestError(
        "Cannot go from status 'ACCEPTED_BY_VALIDATOR' to 'ACCEPTED_BY_COUNSELLOR'",
      ),
    }));
  test("fails for unknown application ids", () =>
    expectPromiseToFailWithError(
      executeUseCase({
        applicationId: "unknown_application_id",
        role: "admin",
        email: "test@test.fr",
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
    email: string;
    newStatus: ApplicationStatus;
    justification?: string;
  };
  const executeUseCase = async ({
    applicationId,
    role,
    email,
    newStatus,
    justification,
  }: ExecuteUseCaseParams): Promise<ImmersionApplicationDto> => {
    const response = await updateImmersionApplicationStatus.execute(
      { status: newStatus, justification },
      createMagicLinkPayload(applicationId, role, email),
    );
    expect(response.id).toEqual(applicationId);
    const storedImmersionApplication =
      await immersionApplicationRepository.getById(applicationId);
    return storedImmersionApplication.toDto();
  };

  type ExtractFromDomainTopics<T extends DomainTopic> = Extract<DomainTopic, T>;

  type ImmersionApplicationDomainTopic = ExtractFromDomainTopics<
    | "ImmersionApplicationSubmittedByBeneficiary"
    | "ImmersionApplicationAcceptedByCounsellor"
    | "ImmersionApplicationAcceptedByValidator"
    | "FinalImmersionApplicationValidationByAdmin"
    | "ImmersionApplicationRejected"
    | "ImmersionApplicationRequiresModification"
  >;

  type TestAcceptNewStatusParams = {
    role: Role;
    oldStatus: ApplicationStatus;
    newStatus: ApplicationStatus;
    expectedDomainTopic: ImmersionApplicationDomainTopic;
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
      email: "test@test.fr",
      newStatus,
    });

    const expectedImmersionApplication: ImmersionApplicationDto = {
      ...originalImmersionApplication,
      status: newStatus,
    };
    expect(storedImmersionApplication).toEqual(expectedImmersionApplication);

    if (expectedDomainTopic === "ImmersionApplicationRequiresModification") {
      const payload = {
        application: expectedImmersionApplication,
        reason: "test-modification-justification",
        roles: ["beneficiary" as Role],
      };

      await expectNewEvent(expectedDomainTopic, {
        topic: "ImmersionApplicationRequiresModification",
        payload,
      });
    } else {
      await expectNewEvent(expectedDomainTopic, {
        topic: expectedDomainTopic,
        payload: expectedImmersionApplication,
      });
    }
  };

  type TestAcceptsStatusUpdateToRejectedParams = {
    role: Role;
    oldStatus: ApplicationStatus;
  };
  const testAcceptsStatusUpdateToRejected = async ({
    role,
    oldStatus,
  }: TestAcceptsStatusUpdateToRejectedParams) => {
    const originalImmersionApplication = await setupInitialState({ oldStatus });
    const storedImmersionApplication = await executeUseCase({
      applicationId: originalImmersionApplication.id,
      role,
      newStatus: "REJECTED",
      justification: "test-rejection-justification",
      email: "test@test.fr",
    });

    const expectedImmersionApplication: ImmersionApplicationDto = {
      ...originalImmersionApplication,
      status: "REJECTED",
      rejectionJustification: "test-rejection-justification",
    };
    expect(storedImmersionApplication).toEqual(expectedImmersionApplication);

    await expectNewEvent("ImmersionApplicationRejected", {
      payload: expectedImmersionApplication,
    });
  };

  type TestAcceptsStatusUpdateToDraftParams = {
    role: Role;
    oldStatus: ApplicationStatus;
  };
  const testAcceptsStatusUpdateToDraftAndInvalidatesSignatures = async ({
    role,
    oldStatus,
  }: TestAcceptsStatusUpdateToDraftParams) => {
    const originalImmersionApplication = await setupInitialState({ oldStatus });
    const storedImmersionApplication = await executeUseCase({
      applicationId: originalImmersionApplication.id,
      role,
      newStatus: "DRAFT",
      justification: "test-modification-justification",
      email: "test@test.fr",
    });

    const expectedImmersionApplication: ImmersionApplicationDto = {
      ...originalImmersionApplication,
      status: "DRAFT",
      beneficiaryAccepted: false,
      enterpriseAccepted: false,
    };
    expect(storedImmersionApplication).toEqual(expectedImmersionApplication);

    await expectNewEvent("ImmersionApplicationRequiresModification", {
      payload: {
        application: expectedImmersionApplication,
        reason: "test-modification-justification",
        roles: ["beneficiary", "establishment"],
      },
    });
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
        email: "test@test.fr",
      }),
      expectedError,
    );
  };

  const expectNewEvent = async <T extends DomainTopic>(
    topic: T,
    expectedEvent: Partial<NarrowEvent<T>>,
  ) => {
    const allEvents = await outboxRepository.getAllUnpublishedEvents();
    expect(allEvents).toHaveLength(1);
    expect(allEvents[0]).toMatchObject(expectedEvent);
  };
});
