import { values } from "ramda";
import {
  AgencyDtoBuilder,
  AgencyRole,
  ConventionDto,
  ConventionDtoBuilder,
  ConventionId,
  ConventionRelatedJwtPayload,
  ConventionStatus,
  Email,
  InclusionConnectedUser,
  Role,
  UpdateConventionStatusRequestDto,
  allRoles,
  conventionStatuses,
  createConventionMagicLinkPayload,
  expectPromiseToFailWithError,
  expectToEqual,
  splitCasesBetweenPassingAndFailing,
} from "shared";
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from "../../../adapters/primary/helpers/httpErrors";
import { InMemoryConventionRepository } from "../../../adapters/secondary/InMemoryConventionRepository";
import { InMemoryOutboxQueries } from "../../core/events/adapters/InMemoryOutboxQueries";
import { InMemoryOutboxRepository } from "../../core/events/adapters/InMemoryOutboxRepository";
import { ConventionRequiresModificationPayload } from "../../core/events/eventPayload.dto";
import { DomainTopic } from "../../core/events/events";
import {
  NarrowEvent,
  makeCreateNewEvent,
} from "../../core/events/ports/EventBus";
import { CustomTimeGateway } from "../../core/time-gateway/adapters/CustomTimeGateway";
import { InMemoryUowPerformer } from "../../core/unit-of-work/adapters/InMemoryUowPerformer";
import { createInMemoryUow } from "../../core/unit-of-work/adapters/createInMemoryUow";
import { TestUuidGenerator } from "../../core/uuid-generator/adapters/UuidGeneratorImplementations";
import { UpdateConventionStatus } from "./UpdateConventionStatus";

const allInclusionConnectedTestUsers = [
  "icUserWithRoleToReview",
  "icUserWithRoleCounsellor",
  "icUserWithRoleValidator",
  "icUserWithRoleAgencyOwner",
  "icUserWithRoleEstablishmentRepresentative",
] as const;

type InclusionConnectedTestUser =
  (typeof allInclusionConnectedTestUsers)[number];

const fakeAgency = new AgencyDtoBuilder().build();

const establishmentRepEmail: Email = "establishmentrep@email.com";

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
    establishmentDashboards: {},
    externalId: "icUserWithRoleToReview-external-id",
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
    establishmentDashboards: {},
    externalId: "icUserWithRoleCounsellor-external-id",
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
    establishmentDashboards: {},
    externalId: "icUserWithRoleValidator-external-id",
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
    establishmentDashboards: {},
    externalId: "icUserWithRoleAgencyOwner-external-id",
  },
  icUserWithRoleEstablishmentRepresentative: {
    agencyRights: [],
    email: establishmentRepEmail,
    firstName: "icUserWithRoleEstablishmentRepresentativeFirstName",
    id: "icUserWithRoleEstablishmentRepresentative",
    lastName: "Owner",
    establishmentDashboards: {},
    externalId: "icUserWithRoleEstablishmentRepresentative-external-id",
  },
};

type ExtractFromDomainTopics<T extends DomainTopic> = Extract<DomainTopic, T>;

type ConventionDomainTopic = ExtractFromDomainTopics<
  | "ConventionSubmittedByBeneficiary"
  | "ConventionPartiallySigned"
  | "ConventionFullySigned"
  | "ConventionAcceptedByCounsellor"
  | "ConventionAcceptedByValidator"
  | "ConventionRejected"
  | "ConventionRequiresModification"
  | "ConventionCancelled"
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
    .withEstablishmentRepresentativeEmail(establishmentRepEmail);
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

  conventionRepository.setConventions([originalConvention]);
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

    if (expectedDomainTopic === "ConventionRequiresModification") {
      if (updateStatusParams.status !== "DRAFT")
        throw new Error(
          `Expected domain topic ${expectedDomainTopic} not supported with convention status ${updateStatusParams.status}`,
        );
      const role = defineRoleForTest(
        testAcceptNewStatusParams,
        expectedConvention,
      );

      if (!role || role === "agencyOwner" || role === "toReview")
        throw new Error(
          `No supported role found according to ${JSON.stringify(
            testAcceptNewStatusParams,
          )}`,
        );

      const payload: ConventionRequiresModificationPayload =
        updateStatusParams.modifierRole === "validator" ||
        updateStatusParams.modifierRole === "counsellor"
          ? {
              convention: expectedConvention,
              justification: updateStatusParams.statusJustification,
              requesterRole: role,
              modifierRole: updateStatusParams.modifierRole,
              agencyActorEmail: "agency-actor@gmail.com",
            }
          : {
              convention: expectedConvention,
              justification: updateStatusParams.statusJustification,
              requesterRole: role,
              modifierRole: updateStatusParams.modifierRole,
            };

      await expectNewEvent(
        expectedDomainTopic,
        {
          topic: "ConventionRequiresModification",
          payload,
        },
        outboxRepository,
      );
    } else if (expectedDomainTopic) {
      await expectNewEvent(
        expectedDomainTopic,
        {
          topic: expectedDomainTopic,
          payload: { convention: expectedConvention },
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
        updateStatusParams,
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
  allowedMagicLinkRoles: Role[];
  allowedInclusionConnectedUsers: InclusionConnectedTestUser[];
  allowedInitialStatuses: ConventionStatus[];
  nextDate?: Date;
};

export const testForAllRolesAndInitialStatusCases = ({
  allowedMagicLinkRoles,
  expectedDomainTopic,
  updatedFields = {},
  allowedInitialStatuses,
  allowedInclusionConnectedUsers,
  nextDate,
  updateStatusParams,
}: TestAllCaseProps) => {
  const [allowedRolesToUpdate, notAllowedRolesToUpdate] =
    splitCasesBetweenPassingAndFailing(allRoles, allowedMagicLinkRoles);

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

    it.each(allowedMagicLinkRoles.map((role) => ({ role })))(
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
            expectedError: new ForbiddenError(
              `Role '${role}' is not allowed to go to status '${updateStatusParams.status}' for convention '${updateStatusParams.conventionId}'.`,
            ),
          });
        },
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
            `Role '${
              makeUserIdMapInclusionConnectedUser[userId].email ===
              establishmentRepEmail
                ? "establishment-representative"
                : makeUserIdMapInclusionConnectedUser[userId].agencyRights.find(
                    (agencyRight) => agencyRight.agency.id === fakeAgency.id,
                  )?.role
            }' is not allowed to go to status '${
              updateStatusParams.status
            }' for convention '${updateStatusParams.conventionId}'.`,
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

const defineRoleForTest = (
  testAcceptNewStatusParams: TestAcceptNewStatusParams,
  expectedConvention: ConventionDto,
): Role | AgencyRole | undefined => {
  if ("role" in testAcceptNewStatusParams)
    return testAcceptNewStatusParams.role;

  if (
    testAcceptNewStatusParams.userId ===
    "icUserWithRoleEstablishmentRepresentative"
  )
    return "establishment-representative";

  return makeUserIdMapInclusionConnectedUser[
    testAcceptNewStatusParams.userId
  ].agencyRights.find(
    (agencyRight) => agencyRight.agency.id === expectedConvention.agencyId,
  )?.role;
};