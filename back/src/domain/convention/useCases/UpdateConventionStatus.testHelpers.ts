import { values } from "ramda";
import {
  AgencyDtoBuilder,
  allRoles,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionId,
  ConventionRelatedJwtPayload,
  ConventionStatus,
  conventionStatuses,
  createConventionMagicLinkPayload,
  doesStatusNeedsJustification,
  expectPromiseToFailWithError,
  expectToEqual,
  InclusionConnectedUser,
  Role,
  splitCasesBetweenPassingAndFailing,
  UpdateConventionStatusRequestDto,
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
import { UpdateConventionStatus } from "../../../domain/convention/useCases/UpdateConventionStatus";
import {
  makeCreateNewEvent,
  NarrowEvent,
} from "../../../domain/core/eventBus/EventBus";
import { DomainTopic } from "../../../domain/core/eventBus/events";
import { ConventionRequiresModificationPayload } from "../../core/eventBus/eventPayload.dto";

export const allInclusionConnectedTestUsers = [
  "icUserWithRoleToReview",
  "icUserWithRoleCounsellor",
  "icUserWithRoleValidator",
  "icUserWithRoleAgencyOwner",
] as const;

type InclusionConnectedTestUser =
  (typeof allInclusionConnectedTestUsers)[number];

const fakeAgency = new AgencyDtoBuilder().build();

const makeUserIdMapInclusionConnectedUser: Record<
  InclusionConnectedTestUser,
  InclusionConnectedUser
> = {
  icUserWithRoleToReview: {
    agencyRights: [
      {
        agency: fakeAgency,
        role: "toReview",
      },
    ],
    email: "icUserWithRoleToReview@mail.com",
    firstName: "icUserWithRoleToReview",
    id: "icUserWithRoleToReview",
    lastName: "ToReview",
  },
  icUserWithRoleCounsellor: {
    agencyRights: [
      {
        agency: fakeAgency,
        role: "counsellor",
      },
    ],
    email: "icUserWithRoleCounsellor@mail.com",
    firstName: "icUserWithRoleCounsellor",
    id: "icUserWithRoleCounsellor",
    lastName: "Consellor",
  },
  icUserWithRoleValidator: {
    agencyRights: [
      {
        agency: fakeAgency,
        role: "validator",
      },
    ],
    email: "icUserWithRoleValidator@mail.com",
    firstName: "icUserWithRoleValidator",
    id: "icUserWithRoleValidator",
    lastName: "Validator",
  },

  icUserWithRoleAgencyOwner: {
    agencyRights: [
      {
        agency: fakeAgency,
        role: "agencyOwner",
      },
    ],
    email: "icUserWithRoleAgencyOwner@mail.com",
    firstName: "icUserWithRoleAgencyOwner",
    id: "icUserWithRoleAgencyOwner",
    lastName: "Owner",
  },
};

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
  | "ConventionDeprecated"
> | null; // null is used to indicate that no domain event should be sent

type SetupInitialStateParams = {
  initialStatus: ConventionStatus;
  withIcUser: boolean;
  alreadySigned?: boolean;
};
export const originalConventionId: ConventionId =
  "add5c20e-6dd2-45af-affe-927358005251";

export const setupInitialState = ({
  initialStatus,
  alreadySigned = true,
  withIcUser,
}: SetupInitialStateParams) => {
  const conventionBuilder = new ConventionDtoBuilder()
    .withId(originalConventionId)
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

  const updateConventionStatusUseCase = new UpdateConventionStatus(
    new InMemoryUowPerformer(uow),
    createNewEvent,
    timeGateway,
  );

  conventionRepository.setConventions({
    [originalConvention.id]: originalConvention,
  });
  withIcUser &&
    uow.inclusionConnectedUserRepository.setInclusionConnectedUsers(
      values(makeUserIdMapInclusionConnectedUser),
    );
  return {
    originalConvention,
    updateConventionStatusUseCase,
    conventionRepository,
    outboxRepository,
    timeGateway,
  };
};

type ExecuteUseCaseParamsByUserId = {
  jwtPayload: ConventionRelatedJwtPayload;
  updateStatusParams: UpdateConventionStatusRequestDto;
  updateConventionStatusUseCase: UpdateConventionStatus;
  conventionRepository: InMemoryConventionRepository;
};

export const executeUpdateConventionStatusUseCase = async ({
  jwtPayload,
  updateStatusParams,
  updateConventionStatusUseCase,
  conventionRepository,
}: ExecuteUseCaseParamsByUserId): Promise<ConventionDto> => {
  const response = await updateConventionStatusUseCase.execute(
    updateStatusParams,
    jwtPayload,
  );
  expect(response.id).toEqual(updateStatusParams.conventionId);
  const storedConvention = await conventionRepository.getById(
    updateStatusParams.conventionId,
  );
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
  initialStatus: ConventionStatus;
} & ({ role: Role } | { userId: InclusionConnectedTestUser });

type UpdatedFields = Partial<
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
  async (testAcceptNewStatusParams: TestAcceptNewStatusParams) => {
    const {
      originalConvention,
      updateConventionStatusUseCase,
      conventionRepository,
      outboxRepository,
      timeGateway,
    } = await setupInitialState({
      initialStatus: testAcceptNewStatusParams.initialStatus,
      withIcUser: "userId" in testAcceptNewStatusParams,
    });

    if (nextDate) timeGateway.setNextDate(nextDate);

    const jwt: ConventionRelatedJwtPayload =
      "role" in testAcceptNewStatusParams
        ? createConventionMagicLinkPayload({
            id: originalConvention.id,
            role: testAcceptNewStatusParams.role,
            email: "",
            now: new Date(),
          })
        : {
            userId: testAcceptNewStatusParams.userId,
          };
    const storedConvention = await executeUpdateConventionStatusUseCase({
      jwtPayload: jwt,
      updateStatusParams,
      updateConventionStatusUseCase,
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
      const role =
        "role" in testAcceptNewStatusParams
          ? testAcceptNewStatusParams.role
          : makeUserIdMapInclusionConnectedUser[
              testAcceptNewStatusParams.userId
            ].agencyRights.find(
              (agencyRight) =>
                agencyRight.agency.id === expectedConvention.agencyId,
            )?.role;

      if (!role || role === "agencyOwner" || role === "toReview")
        throw new Error(
          `No supported role found according to ${JSON.stringify(
            testAcceptNewStatusParams,
          )}`,
        );

      const payload: ConventionRequiresModificationPayload = {
        convention: expectedConvention,
        justification:
          updateStatusParams.status === "DRAFT"
            ? updateStatusParams.statusJustification
            : "was not provided",
        roles: [role],
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
  initialStatus: ConventionStatus;
  expectedError: UnauthorizedError | BadRequestError;
} & (
  | {
      role: Role;
    }
  | {
      userId: InclusionConnectedTestUser;
    }
);

type TestRejectsExpectation = {
  targetStatus: ConventionStatus;
};

const makeTestRejectsStatusUpdate =
  ({ targetStatus }: TestRejectsExpectation) =>
  async (testRejectsNewStatusParams: TestRejectsNewStatusParams) => {
    const {
      originalConvention,
      updateConventionStatusUseCase,
      conventionRepository,
      timeGateway,
    } = await setupInitialState({
      initialStatus: testRejectsNewStatusParams.initialStatus,
      withIcUser: "userId" in testRejectsNewStatusParams,
    });
    const jwtPayload: ConventionRelatedJwtPayload =
      "role" in testRejectsNewStatusParams
        ? createConventionMagicLinkPayload({
            id: originalConvention.id,
            email: "",
            role: testRejectsNewStatusParams.role,
            now: timeGateway.now(),
          })
        : {
            userId: testRejectsNewStatusParams.userId,
          };
    await expectPromiseToFailWithError(
      executeUpdateConventionStatusUseCase({
        jwtPayload,
        updateStatusParams: doesStatusNeedsJustification(targetStatus)
          ? {
              status: targetStatus,
              statusJustification: "fake justification",
              conventionId: originalConvention.id,
            }
          : { status: targetStatus, conventionId: originalConvention.id },
        updateConventionStatusUseCase,
        conventionRepository,
      }),
      testRejectsNewStatusParams.expectedError,
    );
  };

type TestAllCaseProps = {
  updateStatusParams: UpdateConventionStatusRequestDto;
  expectedDomainTopic: ConventionDomainTopic;
  updatedFields?: UpdatedFields;
  allowedRoles: Role[];
  allowedInclusionConnectedUsers: InclusionConnectedTestUser[];
  allowedInitialStatuses: ConventionStatus[];
  nextDate?: Date;
};

export const testForAllRolesAndInitialStatusCases = ({
  allowedRoles,
  expectedDomainTopic,
  updatedFields = {},
  allowedInitialStatuses,
  allowedInclusionConnectedUsers,
  nextDate,
  updateStatusParams,
}: TestAllCaseProps) => {
  const [allowedRolesToUpdate, notAllowedRolesToUpdate] =
    splitCasesBetweenPassingAndFailing(allRoles, allowedRoles);

  const [
    allowedInclusionConnectedUsersToUpdate,
    notAllowedInclusionConnectedUsersToUpdate,
  ] = splitCasesBetweenPassingAndFailing(
    allInclusionConnectedTestUsers,
    allowedInclusionConnectedUsers,
  );

  const [authorizedInitialStatuses, forbiddenInitalStatuses] =
    splitCasesBetweenPassingAndFailing(
      conventionStatuses,
      allowedInitialStatuses,
    );

  const someValidInitialStatus = authorizedInitialStatuses[0];
  const someValidRole = allowedRolesToUpdate[0];

  describe("Accepted", () => {
    const testAcceptsStatusUpdate = makeTestAcceptsStatusUpdate({
      updateStatusParams,
      expectedDomainTopic,
      updatedFields,
      nextDate,
    });

    it.each(allowedRoles.map((role) => ({ role })))(
      "Accepted from role '$role'",
      ({ role }) =>
        testAcceptsStatusUpdate({
          role,
          initialStatus: someValidInitialStatus,
        }),
    );

    if (allowedInclusionConnectedUsersToUpdate.length)
      it.each(
        allowedInclusionConnectedUsersToUpdate.map((userId) => ({ userId })),
      )("Accepted from userId '$userId'", ({ userId }) =>
        testAcceptsStatusUpdate({
          userId,
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
  });

  describe("Rejected", () => {
    const testRejectsStatusUpdate = makeTestRejectsStatusUpdate({
      targetStatus: updateStatusParams.status,
    });

    if (notAllowedRolesToUpdate.length) {
      it.each(notAllowedRolesToUpdate.map((role) => ({ role })))(
        "Rejected from role '$role'",
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

    if (notAllowedInclusionConnectedUsersToUpdate.length) {
      it.each(
        notAllowedInclusionConnectedUsersToUpdate.map((userId) => ({ userId })),
      )("Rejected from userId '$userId'", ({ userId }) =>
        testRejectsStatusUpdate({
          userId,
          initialStatus: someValidInitialStatus,
          expectedError: new ForbiddenError(
            `${
              makeUserIdMapInclusionConnectedUser[userId].agencyRights.find(
                (agencyRight) => agencyRight.agency.id === fakeAgency.id,
              )?.role
            } is not allowed to go to status ${updateStatusParams.status}`,
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
  });
};
