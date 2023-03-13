import {
  conventionStatuses,
  allRoles,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionId,
  ConventionStatus,
  createConventionMagicLinkPayload,
  Role,
  expectPromiseToFailWithError,
  splitCasesBetweenPassingAndFailing,
  UpdateConventionStatusRequestDto,
  expectToEqual,
  doesStatusNeedsJustification,
} from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryOutboxQueries } from "../../../adapters/secondary/core/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../../adapters/secondary/core/InMemoryOutboxRepository";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { ConventionRequiresModificationPayload } from "../../../domain/convention/useCases/notifications/NotifyBeneficiaryAndEnterpriseThatApplicationNeedsModification";
import { UpdateConventionStatus } from "../../../domain/convention/useCases/UpdateConventionStatus";
import {
  makeCreateNewEvent,
  NarrowEvent,
} from "../../../domain/core/eventBus/EventBus";
import { DomainTopic } from "../../../domain/core/eventBus/events";

type ExtractFromDomainTopics<T extends DomainTopic> = Extract<DomainTopic, T>;

type ConventionDomainTopic = ExtractFromDomainTopics<
  | "ImmersionApplicationSubmittedByBeneficiary"
  | "ImmersionApplicationPartiallySigned"
  | "ImmersionApplicationFullySigned"
  | "ImmersionApplicationAcceptedByCounsellor"
  | "ImmersionApplicationAcceptedByValidator"
  | "ImmersionApplicationRejected"
  | "ImmersionApplicationRequiresModification"
  | "ImmersionApplicationCancelled"
> | null; // null is used to indicate that no domain event should be sent

type SetupInitialStateParams = {
  initialStatus: ConventionStatus;
  alreadySigned?: boolean;
};

export const setupInitialState = async ({
  initialStatus,
  alreadySigned = true,
}: SetupInitialStateParams) => {
  const conventionBuilder = new ConventionDtoBuilder()
    .withStatus(initialStatus)
    .withoutDateValidation();
  const originalConvention = alreadySigned
    ? conventionBuilder.build()
    : conventionBuilder.notSigned().build();

  const uow = createInMemoryUow();
  const conventionRepository = uow.conventionRepository;
  const outboxRepository = uow.outboxRepository;
  const timeGateway = new CustomTimeGateway();
  const createNewEvent = makeCreateNewEvent({
    timeGateway,
    uuidGenerator: new TestUuidGenerator(),
  });

  const updateConventionStatus = new UpdateConventionStatus(
    new InMemoryUowPerformer(uow),
    createNewEvent,
    timeGateway,
  );

  await conventionRepository.save(originalConvention);
  return {
    originalConvention,
    updateConventionStatus,
    conventionRepository,
    outboxRepository,
    timeGateway,
  };
};

type ExecuteUseCaseParams = {
  conventionId: ConventionId;
  role: Role;
  email: string;
  updateStatusParams: UpdateConventionStatusRequestDto;
  updateConventionStatus: UpdateConventionStatus;
  conventionRepository: InMemoryConventionRepository;
};

export const executeUpdateConventionStatusUseCase = async ({
  conventionId,
  role,
  email,
  updateStatusParams,
  updateConventionStatus,
  conventionRepository,
}: ExecuteUseCaseParams): Promise<ConventionDto> => {
  const payload = createConventionMagicLinkPayload({
    id: conventionId,
    role,
    email,
    now: new Date(),
  });
  const response = await updateConventionStatus.execute(updateStatusParams, {
    conventionId: payload.applicationId,
    role: payload.role,
  });
  expect(response.id).toEqual(conventionId);
  const storedConvention = await conventionRepository.getById(conventionId);
  return storedConvention;
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
  initialStatus: ConventionStatus;
};

export type UpdatedFields = Partial<
  ConventionDto & {
    establishmentRepresentativeSignedAt: string | undefined;
    beneficiarySignedAt: string | undefined;
  }
>;

type TestAcceptExpectation = {
  updateStatusParams: UpdateConventionStatusRequestDto;
  expectedDomainTopic: ConventionDomainTopic;
  updatedFields?: UpdatedFields;
  nextDate?: Date;
};

const makeTestAcceptsStatusUpdate =
  ({
    updateStatusParams,
    expectedDomainTopic,
    updatedFields = {},
    nextDate,
  }: TestAcceptExpectation) =>
  async ({ role, initialStatus }: TestAcceptNewStatusParams) => {
    const {
      originalConvention,
      updateConventionStatus,
      conventionRepository,
      outboxRepository,
      timeGateway,
    } = await setupInitialState({
      initialStatus,
    });

    if (nextDate) timeGateway.setNextDate(nextDate);

    const storedConvention = await executeUpdateConventionStatusUseCase({
      conventionId: originalConvention.id,
      role,
      email: "test@test.fr",
      updateStatusParams,
      updateConventionStatus,
      conventionRepository,
    });

    const {
      beneficiarySignedAt,
      establishmentRepresentativeSignedAt,
      signatories,
      internshipKind,
      ...restOfUpdatedFields
    } = updatedFields;

    const hasSignedProperty: boolean =
      Object.hasOwn(updatedFields, "beneficiarySignedAt") ||
      Object.hasOwn(updatedFields, "establishementRepresentativeSignedAt");

    const expectedConvention = new ConventionDtoBuilder({
      ...originalConvention,
      ...restOfUpdatedFields,
    })
      .withStatusJustification(
        restOfUpdatedFields.statusJustification
          ? restOfUpdatedFields.statusJustification
          : originalConvention.statusJustification,
      )
      .withStatus(updateStatusParams.status)
      .signedByBeneficiary(
        hasSignedProperty
          ? beneficiarySignedAt
          : originalConvention.signatories.beneficiary.signedAt,
      )
      .signedByEstablishmentRepresentative(
        hasSignedProperty
          ? establishmentRepresentativeSignedAt
          : originalConvention.signatories.establishmentRepresentative.signedAt,
      )
      .build();

    expectToEqual(storedConvention, expectedConvention);

    if (expectedDomainTopic === "ImmersionApplicationRequiresModification") {
      const payload: ConventionRequiresModificationPayload = {
        convention: expectedConvention,
        justification:
          updateStatusParams.status === "DRAFT"
            ? updateStatusParams.justification
            : "was not provided",
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
          payload: expectedConvention,
        },
        outboxRepository,
      );
    }
  };

type TestRejectsNewStatusParams = {
  role: Role;
  initialStatus: ConventionStatus;
  expectedError: UnauthorizedError | BadRequestError;
};

type TestRejectsExpectation = {
  targetStatus: ConventionStatus;
};

const makeTestRejectsStatusUpdate =
  ({ targetStatus }: TestRejectsExpectation) =>
  async ({
    role,
    initialStatus,
    expectedError,
  }: TestRejectsNewStatusParams) => {
    const { originalConvention, updateConventionStatus, conventionRepository } =
      await setupInitialState({
        initialStatus,
      });
    await expectPromiseToFailWithError(
      executeUpdateConventionStatusUseCase({
        conventionId: originalConvention.id,
        role,
        updateStatusParams: doesStatusNeedsJustification(targetStatus)
          ? { status: targetStatus, justification: "fake justification" }
          : { status: targetStatus },
        email: "test@test.fr",
        updateConventionStatus,
        conventionRepository,
      }),
      expectedError,
    );
  };

interface TestAllCaseProps {
  updateStatusParams: UpdateConventionStatusRequestDto;
  expectedDomainTopic: ConventionDomainTopic;
  updatedFields?: UpdatedFields;
  allowedRoles: Role[];
  allowedInitialStatuses: ConventionStatus[];
  nextDate?: Date;
}

export const testForAllRolesAndInitialStatusCases = ({
  allowedRoles,
  expectedDomainTopic,
  updatedFields = {},
  allowedInitialStatuses,
  nextDate,
  updateStatusParams,
}: TestAllCaseProps) => {
  const [allowToRejectRoles, notAllowedToRejectRoles] =
    splitCasesBetweenPassingAndFailing<Role>(allRoles, allowedRoles);

  const [authorizedInitialStatuses, forbiddenInitalStatuses] =
    splitCasesBetweenPassingAndFailing<ConventionStatus>(
      conventionStatuses,
      allowedInitialStatuses,
    );

  const someValidInitialStatus = authorizedInitialStatuses[0];
  const someValidRole = allowToRejectRoles[0];

  //RIGHT PATHS
  const testAcceptsStatusUpdate = makeTestAcceptsStatusUpdate({
    updateStatusParams,
    expectedDomainTopic,
    updatedFields,
    nextDate,
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

  //WRONG PATHS

  const testRejectsStatusUpdate = makeTestRejectsStatusUpdate({
    targetStatus: updateStatusParams.status,
  });

  if (notAllowedToRejectRoles.length) {
    it.each(notAllowedToRejectRoles.map((role) => ({ role })))(
      "Rejected from '$role'",
      ({ role }) =>
        testRejectsStatusUpdate({
          role,
          initialStatus: someValidInitialStatus,
          expectedError: new ForbiddenError(
            `${role} is not allowed to go to status ${updateStatusParams.status}`,
          ),
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
          `Cannot go from status '${status}' to '${updateStatusParams.status}'`,
        ),
      }),
  );
};
