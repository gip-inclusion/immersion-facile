import { values } from "ramda";
import {
  AgencyDtoBuilder,
  type BadRequestError,
  type ConventionDto,
  ConventionDtoBuilder,
  type ConventionId,
  type ConventionRelatedJwtPayload,
  type ConventionStatus,
  type Email,
  type Role,
  type UnauthorizedError,
  type UpdateConventionStatusRequestDto,
  type UserWithAdminRights,
  allRoles,
  conventionStatuses,
  errors,
  expectPromiseToFailWithError,
  expectToEqual,
  splitCasesBetweenPassingAndFailing,
} from "shared";
import { toAgencyWithRights } from "../../../utils/agency";
import { createConventionMagicLinkPayload } from "../../../utils/jwt";

import { InMemoryOutboxQueries } from "../../core/events/adapters/InMemoryOutboxQueries";
import type { InMemoryOutboxRepository } from "../../core/events/adapters/InMemoryOutboxRepository";
import type { DomainTopic, TriggeredBy } from "../../core/events/events";
import {
  type NarrowEvent,
  makeCreateNewEvent,
} from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import type { InMemoryConventionRepository } from "../adapters/InMemoryConventionRepository";
import { UpdateConventionStatus } from "./UpdateConventionStatus";

const allInclusionConnectedTestUsers = [
  "icUserWithRoleToReview",
  "icUserWithRoleCounsellor",
  "icUserWithRoleValidator",
  "icUserWithRoleAgencyAdmin",
  "icUserWithRoleEstablishmentRepresentative",
  "icUserWithRoleBackofficeAdmin",
  "icUserWithRoleBackofficeAdminAndValidator",
] as const;

type InclusionConnectedTestUser =
  (typeof allInclusionConnectedTestUsers)[number];

const establishmentRepEmail: Email = "establishmentrep@email.com";

const icUserWithRoleBackofficeAdmin: UserWithAdminRights = {
  email: "icUserWithRoleBackofficeAdmin@mail.com",
  id: "icUserWithRoleBackofficeAdmin",
  firstName: "icUserWithRoleBackofficeAdmin",
  lastName: "BackofficeAdmin",
  proConnect: {
    externalId: "icUserWithRoleBackOfficeAdmin-external-id",
    siret: "000001111122222",
  },
  createdAt: new Date().toISOString(),
  isBackofficeAdmin: true,
};

const icUserWithRoleToReview: UserWithAdminRights = {
  email: "icUserWithRoleToReview@mail.com",
  firstName: "icUserWithRoleToReview",
  id: "icUserWithRoleToReview",
  lastName: "ToReview",
  proConnect: {
    externalId: "icUserWithRoleToReview-external-id",
    siret: "000001111122222",
  },
  createdAt: new Date().toISOString(),
};
const icUserWithRoleCounsellor: UserWithAdminRights = {
  email: "icUserWithRoleCounsellor@mail.com",
  firstName: "icUserWithRoleCounsellor",
  id: "icUserWithRoleCounsellor",
  lastName: "Consellor",
  proConnect: {
    externalId: "icUserWithRoleCounsellor-external-id",
    siret: "000001111122222",
  },
  createdAt: new Date().toISOString(),
};

const icUserWithRoleValidator: UserWithAdminRights = {
  email: "icUserWithRoleValidator@mail.com",
  firstName: "icUserWithRoleValidator",
  id: "icUserWithRoleValidator",
  lastName: "Validator",
  proConnect: {
    externalId: "icUserWithRoleValidator-external-id",
    siret: "000001111122222",
  },
  createdAt: new Date().toISOString(),
};

const icUserWithRoleBackofficeAdminAndValidator: UserWithAdminRights = {
  email: "icUserWithRoleBackofficeAdminAndValidator@mail.com",
  firstName: "icUserWithRoleBackofficeAdminAndValidator",
  id: "icUserWithRoleBackofficeAdminAndValidator",
  lastName: "Validator",
  proConnect: {
    externalId: "icUserWithRoleBackofficeAdminAndValidator-external-id",
    siret: "000001111122222",
  },
  createdAt: new Date().toISOString(),
};
const icUserWithRoleAgencyAdmin: UserWithAdminRights = {
  email: "icUserWithRoleAgencyAdmin@mail.com",
  firstName: "icUserWithRoleAgencyAdmin",
  id: "icUserWithRoleAgencyAdmin",
  lastName: "Owner",
  proConnect: {
    externalId: "icUserWithRoleAgencyAdmin-external-id",
    siret: "000001111122222",
  },
  createdAt: new Date().toISOString(),
};
const icUserWithRoleEstablishmentRepresentative: UserWithAdminRights = {
  email: establishmentRepEmail,
  firstName: "icUserWithRoleEstablishmentRepresentativeFirstName",
  id: "icUserWithRoleEstablishmentRepresentative",
  lastName: "Owner",
  proConnect: {
    externalId: "icUserWithRoleEstablishmentRepresentative-external-id",
    siret: "000001111122222",
  },
  createdAt: new Date().toISOString(),
};
const makeUserIdMapInclusionConnectedUser: Record<
  InclusionConnectedTestUser,
  UserWithAdminRights
> = {
  icUserWithRoleBackofficeAdmin,
  icUserWithRoleToReview,
  icUserWithRoleCounsellor,
  icUserWithRoleValidator,
  icUserWithRoleBackofficeAdminAndValidator,
  icUserWithRoleAgencyAdmin,
  icUserWithRoleEstablishmentRepresentative,
};

const agencyWithoutCounsellorEmail = toAgencyWithRights(
  new AgencyDtoBuilder().withId("agency-without-counsellors").build(),
  {
    [icUserWithRoleAgencyAdmin.id]: {
      isNotifiedByEmail: false,
      roles: ["agency-admin"],
    },
    [icUserWithRoleBackofficeAdminAndValidator.id]: {
      isNotifiedByEmail: false,
      roles: ["validator"],
    },
    [icUserWithRoleValidator.id]: {
      isNotifiedByEmail: false,
      roles: ["validator"],
    },
    [icUserWithRoleToReview.id]: {
      isNotifiedByEmail: false,
      roles: ["to-review"],
    },
  },
);

const agencyWithCounsellorEmails = toAgencyWithRights(
  new AgencyDtoBuilder().withId("agency-with-two-step-validation").build(),
  {
    [icUserWithRoleAgencyAdmin.id]: {
      isNotifiedByEmail: false,
      roles: ["agency-admin"],
    },
    [icUserWithRoleBackofficeAdminAndValidator.id]: {
      isNotifiedByEmail: false,
      roles: ["validator"],
    },
    [icUserWithRoleValidator.id]: {
      isNotifiedByEmail: false,
      roles: ["validator"],
    },
    [icUserWithRoleCounsellor.id]: {
      isNotifiedByEmail: false,
      roles: ["counsellor"],
    },
    [icUserWithRoleToReview.id]: {
      isNotifiedByEmail: false,
      roles: ["to-review"],
    },
  },
);

type ExtractFromDomainTopics<T extends DomainTopic> = Extract<DomainTopic, T>;

type ConventionDomainTopic = ExtractFromDomainTopics<
  | "ConventionSubmittedByBeneficiary"
  | "ConventionPartiallySigned"
  | "ConventionFullySigned"
  | "ConventionAcceptedByCounsellor"
  | "ConventionAcceptedByValidator"
  | "ConventionRejected"
  | "ConventionCancelled"
  | "ConventionDeprecated"
> | null; // null is used to indicate that no domain event should be sent

type SetupInitialStateParams = {
  initialStatus: ConventionStatus;
  conventionId: ConventionId;
  alreadySigned?: boolean;
  hasAssessment?: boolean;
};
export const conventionWithAgencyOneStepValidationId: ConventionId =
  "add5c20e-6dd2-45af-affe-927358005251";
export const conventionWithAgencyTwoStepsValidationId: ConventionId =
  "add5c20e-6dd2-45af-affe-927358005252";

export const setupInitialState = ({
  initialStatus,
  alreadySigned = true,
  conventionId,
  hasAssessment = false,
}: SetupInitialStateParams) => {
  const conventionBuilder = new ConventionDtoBuilder()
    .withId(conventionWithAgencyOneStepValidationId)
    .withStatus(initialStatus)
    .withEstablishmentRepresentativeEmail(establishmentRepEmail)
    .withAgencyId(agencyWithoutCounsellorEmail.id);

  const originalConvention = alreadySigned
    ? conventionBuilder.build()
    : conventionBuilder.notSigned().build();

  const conventionWithAgencyTwoStepsValidationBuilder =
    new ConventionDtoBuilder()
      .withId(conventionWithAgencyTwoStepsValidationId)
      .withStatus(initialStatus)
      .withEstablishmentRepresentativeEmail(establishmentRepEmail)
      .withAgencyId(agencyWithCounsellorEmails.id);

  const conventionWithAgencyTwoStepsValidation: ConventionDto = {
    ...(alreadySigned
      ? conventionWithAgencyTwoStepsValidationBuilder.build()
      : conventionWithAgencyTwoStepsValidationBuilder.notSigned().build()),
    dateApproval: undefined,
  };

  const conventionsToTest = {
    [originalConvention.id]: originalConvention,
    [conventionWithAgencyTwoStepsValidation.id]:
      conventionWithAgencyTwoStepsValidation,
  };

  const uow = createInMemoryUow();
  const conventionRepository = uow.conventionRepository;
  const agencyRepository = uow.agencyRepository;
  const outboxRepository = uow.outboxRepository;
  const assessmentRepository = uow.assessmentRepository;
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

  agencyRepository.agencies = [
    agencyWithCounsellorEmails,
    agencyWithoutCounsellorEmail,
  ];
  conventionRepository.setConventions(values(conventionsToTest));
  uow.userRepository.users = values(makeUserIdMapInclusionConnectedUser);
  if (hasAssessment) {
    assessmentRepository.setAssessments([
      {
        conventionId,
        status: "COMPLETED",
        endedWithAJob: false,
        establishmentFeedback: "osef",
        numberOfHoursActuallyMade: 35,
        establishmentAdvices: "pas de conseil",
        _entityName: "Assessment",
      },
    ]);
  }

  return {
    originalConvention: conventionsToTest[conventionId],
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
  ).getEventsToPublish();
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
      conventionId: updateStatusParams.conventionId,
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

    const triggeredBy: TriggeredBy =
      "role" in testAcceptNewStatusParams
        ? {
            kind: "convention-magic-link",
            role: testAcceptNewStatusParams.role,
          }
        : {
            kind: "inclusion-connected",
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
      signatories: _1,
      internshipKind: _2,
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

    if (expectedDomainTopic) {
      await expectNewEvent(
        expectedDomainTopic,
        {
          topic: expectedDomainTopic,
          payload: {
            convention: expectedConvention,
            triggeredBy,
          },
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
  updateStatusParams: UpdateConventionStatusRequestDto;
};

const makeTestRejectsStatusUpdate =
  ({ updateStatusParams }: TestRejectsExpectation) =>
  async (testRejectsNewStatusParams: TestRejectsNewStatusParams) => {
    const {
      originalConvention,
      updateConventionStatusUseCase,
      conventionRepository,
      timeGateway,
    } = await setupInitialState({
      initialStatus: testRejectsNewStatusParams.initialStatus,
      conventionId: updateStatusParams.conventionId,
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
        updateStatusParams,
        updateConventionStatusUseCase,
        conventionRepository,
      }),
      testRejectsNewStatusParams.expectedError,
    );
  };

export const rejectStatusTransitionTests = ({
  allowedMagicLinkRoles,
  allowedInitialStatuses,
  allowedInclusionConnectedUsers,
  updateStatusParams,
}: {
  allowedMagicLinkRoles: Role[];
  allowedInitialStatuses: ConventionStatus[];
  allowedInclusionConnectedUsers: InclusionConnectedTestUser[];
  updateStatusParams: UpdateConventionStatusRequestDto;
}) => {
  const [allowedRolesToUpdate, notAllowedRolesToUpdate] =
    splitCasesBetweenPassingAndFailing(allRoles, allowedMagicLinkRoles);
  const [
    _allowedInclusionConnectedUsersToUpdate,
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

  describe("Rejected", () => {
    const testRejectsStatusUpdate = makeTestRejectsStatusUpdate({
      updateStatusParams,
    });

    if (notAllowedRolesToUpdate.length) {
      it.each(notAllowedRolesToUpdate.map((role) => ({ role })))(
        "Rejected from role '$role'",
        ({ role }) => {
          const userId = "icUserWithRoleEstablishmentRepresentative";
          return testRejectsStatusUpdate({
            userId,
            role,
            initialStatus: someValidInitialStatus,
            expectedError: errors.convention.badRoleStatusChange({
              roles: [role],
              status: updateStatusParams.status,
              conventionId: updateStatusParams.conventionId,
            }),
          });
        },
      );
    }

    if (notAllowedInclusionConnectedUsersToUpdate.length) {
      it.each(
        notAllowedInclusionConnectedUsersToUpdate.map((userId) => ({ userId })),
      )("Rejected from userId '$userId'", ({ userId }) => {
        const user = makeUserIdMapInclusionConnectedUser[userId];
        const getRoles = (): Role[] => {
          if (user.email === establishmentRepEmail)
            return ["establishment-representative"];

          if (user.isBackofficeAdmin) return ["back-office"];

          return agencyWithoutCounsellorEmail.usersRights[userId]?.roles ?? [];
        };

        const roles = getRoles();
        return testRejectsStatusUpdate({
          userId,
          initialStatus: someValidInitialStatus,
          expectedError: roles.length
            ? errors.convention.badRoleStatusChange({
                roles,
                status: updateStatusParams.status,
                conventionId: updateStatusParams.conventionId,
              })
            : errors.user.noRightsOnAgency({
                agencyId: agencyWithoutCounsellorEmail.id,
                userId: user.id,
              }),
        });
      });
    }

    it.each(forbiddenInitalStatuses.map((status) => ({ status })))(
      "Rejected from status $status",
      ({ status }) => {
        // this case is handle separately cause we don't have yet another way to test refined transition config
        // TODO refactor this to handle all refine
        const agencyHasTwoStepsAndValidatorTriesToValidate =
          updateStatusParams.status === "ACCEPTED_BY_VALIDATOR" &&
          status === "IN_REVIEW";

        const error = agencyHasTwoStepsAndValidatorTriesToValidate
          ? errors.convention.twoStepsValidationBadStatus({
              targetStatus: updateStatusParams.status,
              conventionId: updateStatusParams.conventionId,
            })
          : errors.convention.badStatusTransition({
              currentStatus: status,
              targetStatus: updateStatusParams.status,
            });

        return testRejectsStatusUpdate({
          role: someValidRole,
          initialStatus: status,
          expectedError: error,
        });
      },
    );
  });
};

export const acceptStatusTransitionTests = ({
  allowedMagicLinkRoles,
  expectedDomainTopic,
  updatedFields = {},
  allowedInitialStatuses,
  allowedInclusionConnectedUsers,
  nextDate,
  updateStatusParams,
}: {
  allowedMagicLinkRoles: Role[];
  expectedDomainTopic: ConventionDomainTopic;
  updatedFields?: UpdatedFields;
  allowedInitialStatuses: ConventionStatus[];
  allowedInclusionConnectedUsers: InclusionConnectedTestUser[];
  nextDate?: Date;
  updateStatusParams: UpdateConventionStatusRequestDto;
}) => {
  describe(`Accepted with convention id ${updateStatusParams.conventionId}`, () => {
    const someValidInitialStatus = allowedInitialStatuses[0];
    const someValidRole = allowedMagicLinkRoles[0];

    const testAcceptsStatusUpdate = makeTestAcceptsStatusUpdate({
      updateStatusParams,
      expectedDomainTopic,
      updatedFields,
      nextDate,
    });

    it.each(allowedMagicLinkRoles.map((role) => ({ role })))(
      "Accepted from role '$role'",
      ({ role }) =>
        testAcceptsStatusUpdate({
          role,
          initialStatus: someValidInitialStatus,
        }),
    );

    if (allowedInclusionConnectedUsers.length)
      it.each(allowedInclusionConnectedUsers.map((userId) => ({ userId })))(
        "Accepted from userId '$userId'",
        ({ userId }) =>
          testAcceptsStatusUpdate({
            userId,
            initialStatus: someValidInitialStatus,
          }),
      );

    it.each(allowedInitialStatuses.map((status) => ({ status })))(
      "Accepted from status $status",
      ({ status }) =>
        testAcceptsStatusUpdate({
          role: someValidRole,
          initialStatus: status,
        }),
    );
  });
};
