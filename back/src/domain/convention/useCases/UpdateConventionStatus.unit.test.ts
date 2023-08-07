/* eslint-disable jest/require-top-level-describe */
/* eslint-disable jest/consistent-test-it */

import {
  ConventionDtoBuilder,
  ConventionId,
  createConventionMagicLinkPayload,
  expectPromiseToFailWithError,
  expectToEqual,
  signatoryRoles,
} from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { conventionMissingMessage } from "../entities/Convention";
import { UpdateConventionStatus } from "./UpdateConventionStatus";
import {
  executeUpdateConventionStatusUseCase,
  originalConventionId,
  setupInitialState,
  testForAllRolesAndInitialStatusCases,
} from "./UpdateConventionStatus.testHelpers";

describe("UpdateConventionStatus", () => {
  describe("* -> DRAFT transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "DRAFT",
        statusJustification: "test justification",
        conventionId: originalConventionId,
        modifierRole: "beneficiary",
      },
      expectedDomainTopic: "ImmersionApplicationRequiresModification",
      updatedFields: {
        statusJustification: "test justification",
        establishmentRepresentativeSignedAt: undefined,
        beneficiarySignedAt: undefined,
      },
      allowedRoles: [
        "beneficiary",
        "establishment-representative",
        "beneficiary-representative",
        "beneficiary-current-employer",
        "counsellor",
        "validator",
        "backOffice",
      ],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleCounsellor",
        "icUserWithRoleValidator",
      ],
      allowedInitialStatuses: [
        "READY_TO_SIGN",
        "PARTIALLY_SIGNED",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
      ],
    });

    it("ImmersionApplicationRequiresModification event only has the role of the user that requested the change", async () => {
      const uow = createInMemoryUow();

      const outboxRepo = uow.outboxRepository;

      const timeGateway = new CustomTimeGateway();

      const createNewEvent = makeCreateNewEvent({
        timeGateway,
        uuidGenerator: new TestUuidGenerator(),
      });

      const conventionRepository = uow.conventionRepository;
      const uowPerformer = new InMemoryUowPerformer(uow);
      const updateConventionStatus = new UpdateConventionStatus(
        uowPerformer,
        createNewEvent,
        timeGateway,
      );

      const conventionId = "add5c20e-6dd2-45af-affe-927358004444";
      const requesterRole = "beneficiary";

      const conventionBuilder = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .withId(conventionId)
        .build();

      await conventionRepository.save(conventionBuilder);

      await updateConventionStatus.execute(
        {
          status: "DRAFT",
          statusJustification: "because",
          conventionId,
          modifierRole: "beneficiary",
        },
        { applicationId: conventionId, role: requesterRole, emailHash: "" },
      );

      const convention = await conventionRepository.getById(conventionId);

      expect(outboxRepo.events).toHaveLength(1);

      expectToEqual(
        outboxRepo.events[0],
        createNewEvent({
          topic: "ImmersionApplicationRequiresModification",
          payload: {
            convention,
            justification: "because",
            role: requesterRole,
            modifierRole: "beneficiary",
          },
        }),
      );
    });
  });

  describe("* -> READY_TO_SIGN transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "READY_TO_SIGN",
        conventionId: originalConventionId,
      },
      expectedDomainTopic: null,
      allowedRoles: signatoryRoles,
      allowedInclusionConnectedUsers: [],
      allowedInitialStatuses: ["DRAFT"],
    });
  });

  describe("* -> PARTIALLY_SIGNED transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "PARTIALLY_SIGNED",
        conventionId: originalConventionId,
      },
      expectedDomainTopic: "ImmersionApplicationPartiallySigned",
      allowedRoles: signatoryRoles,
      allowedInclusionConnectedUsers: [],
      allowedInitialStatuses: ["READY_TO_SIGN", "PARTIALLY_SIGNED"],
    });
  });

  describe("* -> IN_REVIEW transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "IN_REVIEW",
        conventionId: originalConventionId,
      },
      expectedDomainTopic: "ImmersionApplicationFullySigned",
      allowedRoles: signatoryRoles,
      allowedInclusionConnectedUsers: [],
      allowedInitialStatuses: ["PARTIALLY_SIGNED"],
    });
  });

  describe("* -> ACCEPTED_BY_COUNSELLOR transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "ACCEPTED_BY_COUNSELLOR",
        conventionId: originalConventionId,
      },
      expectedDomainTopic: "ImmersionApplicationAcceptedByCounsellor",
      allowedRoles: ["counsellor"],
      allowedInclusionConnectedUsers: ["icUserWithRoleCounsellor"],
      allowedInitialStatuses: ["IN_REVIEW"],
    });
  });

  describe("* -> ACCEPTED_BY_VALIDATOR transition", () => {
    const validationDate = new Date("2022-01-01T12:00:00.000");
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "ACCEPTED_BY_VALIDATOR",
        conventionId: originalConventionId,
      },
      expectedDomainTopic: "ImmersionApplicationAcceptedByValidator",
      allowedRoles: ["validator"],
      allowedInclusionConnectedUsers: ["icUserWithRoleValidator"],
      allowedInitialStatuses: ["IN_REVIEW", "ACCEPTED_BY_COUNSELLOR"],
      updatedFields: { dateValidation: validationDate.toISOString() },
      nextDate: validationDate,
    });
  });

  describe("* -> REJECTED transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "REJECTED",
        statusJustification: "my rejection justification",
        conventionId: originalConventionId,
      },
      expectedDomainTopic: "ImmersionApplicationRejected",
      updatedFields: { statusJustification: "my rejection justification" },
      allowedRoles: ["backOffice", "validator", "counsellor"],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleValidator",
        "icUserWithRoleCounsellor",
      ],
      allowedInitialStatuses: [
        "PARTIALLY_SIGNED",
        "READY_TO_SIGN",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
      ],
    });
  });

  describe("* -> CANCELLED transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "CANCELLED",
        statusJustification: "Cancelled justification",
        conventionId: originalConventionId,
      },
      expectedDomainTopic: "ImmersionApplicationCancelled",
      updatedFields: { statusJustification: "Cancelled justification" },
      allowedRoles: ["validator", "backOffice"],
      allowedInclusionConnectedUsers: ["icUserWithRoleValidator"],
      allowedInitialStatuses: ["ACCEPTED_BY_VALIDATOR"],
    });
  });

  describe("* -> DEPRECATED transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "DEPRECATED",
        statusJustification: "my deprecation justification",
        conventionId: originalConventionId,
      },
      expectedDomainTopic: "ConventionDeprecated",
      updatedFields: { statusJustification: "my deprecation justification" },
      allowedRoles: ["backOffice", "validator", "counsellor"],
      allowedInclusionConnectedUsers: [
        "icUserWithRoleCounsellor",
        "icUserWithRoleValidator",
      ],
      allowedInitialStatuses: [
        "PARTIALLY_SIGNED",
        "READY_TO_SIGN",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
        "DRAFT",
      ],
    });
  });

  it("fails for unknown convention ids", async () => {
    const { updateConventionStatusUseCase, conventionRepository, timeGateway } =
      await setupInitialState({
        initialStatus: "IN_REVIEW",
        withIcUser: false,
      });
    const missingConventionId: ConventionId =
      "add5c20e-6dd2-45af-affe-000000000000";
    await expectPromiseToFailWithError(
      executeUpdateConventionStatusUseCase({
        jwtPayload: createConventionMagicLinkPayload({
          id: missingConventionId,
          email: "test@test.fr",
          role: "validator",
          now: timeGateway.now(),
        }),
        updateStatusParams: {
          status: "ACCEPTED_BY_VALIDATOR",
          conventionId: missingConventionId,
        },
        updateConventionStatusUseCase,
        conventionRepository,
      }),
      new NotFoundError(conventionMissingMessage(missingConventionId)),
    );
  });
});
