import { partition } from "ramda";
import { ImmersionApplicationDtoBuilder } from "../../../_testBuilders/ImmersionApplicationDtoBuilder";
import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "../../../adapters/primary/helpers/httpErrors";
import { CustomClock } from "../../../adapters/secondary/core/ClockImplementations";
import { InMemoryOutboxQueries } from "../../../adapters/secondary/core/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryImmersionApplicationRepository } from "../../../adapters/secondary/InMemoryImmersionApplicationRepository";
import {
  makeCreateNewEvent,
  NarrowEvent,
} from "../../../domain/core/eventBus/EventBus";
import { DomainTopic } from "../../../domain/core/eventBus/events";
import { ImmersionApplicationEntity } from "../../../domain/immersionApplication/entities/ImmersionApplicationEntity";
import { ImmersionApplicationRequiresModificationPayload } from "../../../domain/immersionApplication/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { UpdateImmersionApplicationStatus } from "../../../domain/immersionApplication/useCases/UpdateImmersionApplicationStatus";
import {
  ApplicationStatus,
  ImmersionApplicationDto,
  validApplicationStatus,
} from "shared/src/ImmersionApplication/ImmersionApplication.dto";
import {
  allRoles,
  createMagicLinkPayload,
  Role,
} from "shared/src/tokens/MagicLinkPayload";

type ExtractFromDomainTopics<T extends DomainTopic> = Extract<DomainTopic, T>;

type ImmersionApplicationDomainTopic = ExtractFromDomainTopics<
  | "ImmersionApplicationSubmittedByBeneficiary"
  | "ImmersionApplicationPartiallySigned"
  | "ImmersionApplicationFullySigned"
  | "ImmersionApplicationAcceptedByCounsellor"
  | "ImmersionApplicationAcceptedByValidator"
  | "FinalImmersionApplicationValidationByAdmin"
  | "ImmersionApplicationRejected"
  | "ImmersionApplicationRequiresModification"
  | "ImmersionApplicationCancelled"
> | null; // null is used to indicate that no domain event should be sent

type SetupInitialStateParams = {
  initialStatus: ApplicationStatus;
  alreadySigned?: boolean;
};

export const setupInitialState = async ({
  initialStatus,
  alreadySigned = true,
}: SetupInitialStateParams) => {
  const immersionBuilder = new ImmersionApplicationDtoBuilder().withStatus(
    initialStatus,
  );
  const originalImmersionApplication = alreadySigned
    ? immersionBuilder.build()
    : immersionBuilder.notSigned().build();

  const immersionApplicationRepository =
    new InMemoryImmersionApplicationRepository();
  const outboxRepository = new InMemoryOutboxRepository();
  const createNewEvent = makeCreateNewEvent({
    clock: new CustomClock(),
    uuidGenerator: new TestUuidGenerator(),
  });

  const updateImmersionApplicationStatus = new UpdateImmersionApplicationStatus(
    immersionApplicationRepository,
    createNewEvent,
    outboxRepository,
  );

  await immersionApplicationRepository.save(
    ImmersionApplicationEntity.create(originalImmersionApplication),
  );
  return {
    originalImmersionApplication,
    updateImmersionApplicationStatus,
    immersionApplicationRepository,
    outboxRepository,
  };
};

type ExecuteUseCaseParams = {
  applicationId: string;
  role: Role;
  email: string;
  targetStatus: ApplicationStatus;
  justification?: string;
  updateImmersionApplicationStatus: UpdateImmersionApplicationStatus;
  immersionApplicationRepository: InMemoryImmersionApplicationRepository;
};

export const executeUpdateApplicationStatusUseCase = async ({
  applicationId,
  role,
  email,
  targetStatus,
  justification,
  updateImmersionApplicationStatus,
  immersionApplicationRepository,
}: ExecuteUseCaseParams): Promise<ImmersionApplicationDto> => {
  const response = await updateImmersionApplicationStatus.execute(
    { status: targetStatus, justification },
    createMagicLinkPayload(applicationId, role, email),
  );
  expect(response.id).toEqual(applicationId);
  const storedImmersionApplication =
    await immersionApplicationRepository.getById(applicationId);
  return storedImmersionApplication.toDto();
};

const expectNewEvent = async <T extends DomainTopic>(
  _topic: T,
  expectedEvent: Partial<NarrowEvent<T>>,
  outboxRepository: InMemoryOutboxRepository,
) => {
  const allEvents = await new InMemoryOutboxQueries(
    outboxRepository,
  ).getAllUnpublishedEvents();
  expect(allEvents).toHaveLength(1);
  expect(allEvents[0]).toMatchObject(expectedEvent);
};

type TestAcceptNewStatusParams = {
  role: Role;
  initialStatus: ApplicationStatus;
};

type TestAcceptExpectation = {
  targetStatus: ApplicationStatus;
  expectedDomainTopic: ImmersionApplicationDomainTopic;
  updatedFields?: Partial<ImmersionApplicationDto>;
  justification?: string;
};

const makeTestAcceptsStatusUpdate =
  ({
    targetStatus,
    expectedDomainTopic,
    updatedFields = {},
    justification,
  }: TestAcceptExpectation) =>
  async ({ role, initialStatus }: TestAcceptNewStatusParams) => {
    const {
      originalImmersionApplication,
      updateImmersionApplicationStatus,
      immersionApplicationRepository,
      outboxRepository,
    } = await setupInitialState({
      initialStatus,
    });
    const storedImmersionApplication =
      await executeUpdateApplicationStatusUseCase({
        applicationId: originalImmersionApplication.id,
        role,
        email: "test@test.fr",
        targetStatus,
        justification,
        updateImmersionApplicationStatus,
        immersionApplicationRepository,
      });

    const expectedImmersionApplication: ImmersionApplicationDto = {
      ...originalImmersionApplication,
      status: targetStatus,
      ...updatedFields,
    };
    expect(storedImmersionApplication).toEqual(expectedImmersionApplication);

    if (expectedDomainTopic === "ImmersionApplicationRequiresModification") {
      const payload: ImmersionApplicationRequiresModificationPayload = {
        application: expectedImmersionApplication,
        reason: justification ?? "was not provided",
        roles: ["beneficiary", "establishment"],
      };

      await expectNewEvent(
        expectedDomainTopic,
        {
          topic: "ImmersionApplicationRequiresModification",
          payload,
        },
        outboxRepository,
      );
    } else if (expectedDomainTopic) {
      await expectNewEvent(
        expectedDomainTopic,
        {
          topic: expectedDomainTopic,
          payload: expectedImmersionApplication,
        },
        outboxRepository,
      );
    }
  };

type TestRejectsNewStatusParams = {
  role: Role;
  initialStatus: ApplicationStatus;
  expectedError: UnauthorizedError | BadRequestError;
};

type TestRejectsExpectation = {
  targetStatus: ApplicationStatus;
};

const makeTestRejectsStatusUpdate =
  ({ targetStatus }: TestRejectsExpectation) =>
  async ({
    role,
    initialStatus,
    expectedError,
  }: TestRejectsNewStatusParams) => {
    const {
      originalImmersionApplication,
      updateImmersionApplicationStatus,
      immersionApplicationRepository,
    } = await setupInitialState({
      initialStatus,
    });
    await expectPromiseToFailWithError(
      executeUpdateApplicationStatusUseCase({
        applicationId: originalImmersionApplication.id,
        role,
        targetStatus,
        email: "test@test.fr",
        updateImmersionApplicationStatus,
        immersionApplicationRepository,
      }),
      expectedError,
    );
  };

export const splitCasesBetweenPassingAndFailing = <T>(
  cases: readonly T[],
  passing: readonly T[],
): [T[], T[]] => partition((status: T) => passing.includes(status), cases);

interface TestAllCaseProps {
  targetStatus: ApplicationStatus;
  expectedDomainTopic: ImmersionApplicationDomainTopic;
  updatedFields?: Partial<ImmersionApplicationDto>;
  justification?: string;
  allowedRoles: Role[];
  allowedInitialStatuses: ApplicationStatus[];
}

export const testForAllRolesAndInitialStatusCases = ({
  allowedRoles,
  expectedDomainTopic,
  updatedFields = {},
  justification,
  allowedInitialStatuses,
  targetStatus,
}: TestAllCaseProps) => {
  const [allowToRejectRoles, notAllowedToRejectRoles] =
    splitCasesBetweenPassingAndFailing<Role>(allRoles, allowedRoles);

  const [authorizedInitialStatuses, forbiddenInitalStatuses] =
    splitCasesBetweenPassingAndFailing<ApplicationStatus>(
      validApplicationStatus,
      allowedInitialStatuses,
    );

  const someValidInitialStatus = authorizedInitialStatuses[0];
  const someValidRole = allowToRejectRoles[0];

  const testAcceptsStatusUpdate = makeTestAcceptsStatusUpdate({
    targetStatus,
    expectedDomainTopic,
    updatedFields,
    justification,
  });

  const testRejectsStatusUpdate = makeTestRejectsStatusUpdate({
    targetStatus,
  });

  it.each(allowedRoles.map((role) => ({ role })))(
    "Accepted from '$role'",
    ({ role }) =>
      testAcceptsStatusUpdate({
        role,
        initialStatus: someValidInitialStatus,
      }),
  );

  it.each(authorizedInitialStatuses.map((status) => ({ status })))(
    "Accepted from status $status",
    ({ status }) =>
      testAcceptsStatusUpdate({
        role: someValidRole,
        initialStatus: status,
      }),
  );

  if (notAllowedToRejectRoles.length) {
    it.each(notAllowedToRejectRoles.map((role) => ({ role })))(
      "Rejected from '$role'",
      ({ role }) =>
        testRejectsStatusUpdate({
          role,
          initialStatus: someValidInitialStatus,
          expectedError: new ForbiddenError(),
        }),
    );
  }

  it.each(forbiddenInitalStatuses.map((status) => ({ status })))(
    "Rejected from status $status",
    ({ status }) =>
      testRejectsStatusUpdate({
        role: someValidRole,
        initialStatus: status,
        expectedError: new BadRequestError(
          `Cannot go from status '${status}' to '${targetStatus}'`,
        ),
      }),
  );
};
