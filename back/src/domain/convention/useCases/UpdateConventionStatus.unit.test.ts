/* eslint-disable jest/require-top-level-describe */
/* eslint-disable jest/consistent-test-it */

import {
  ConventionDtoBuilder,
  expectPromiseToFailWithError,
  expectToEqual,
} from "shared";
import { createInMemoryUow } from "../../../adapters/primary/config/uowConfig";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import { CustomTimeGateway } from "../../../adapters/secondary/core/TimeGateway/CustomTimeGateway";
import { TestUuidGenerator } from "../../../adapters/secondary/core/UuidGeneratorImplementations";
import { InMemoryUowPerformer } from "../../../adapters/secondary/InMemoryUowPerformer";
import { makeCreateNewEvent } from "../../core/eventBus/EventBus";
import { UpdateConventionStatus } from "./UpdateConventionStatus";
import {
  executeUpdateConventionStatusUseCase,
  setupInitialState,
  testForAllRolesAndInitialStatusCases,
} from "./UpdateConventionStatus.testHelpers";

describe("UpdateConventionStatus", () => {
  describe("* -> DRAFT transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "DRAFT",
        statusJustification: "test justification",
      },
      expectedDomainTopic: "ImmersionApplicationRequiresModification",
      updatedFields: {
        statusJustification: undefined,
        establishmentRepresentativeSignedAt: undefined,
        beneficiarySignedAt: undefined,
      },
      allowedRoles: [
        "beneficiary",
        "establishment",
        "establishment-representative",
        "legal-representative",
        "beneficiary-representative",
        "beneficiary-current-employer",
        "counsellor",
        "validator",
        "backOffice",
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

      const conventionId = "1111222233334444";
      const requesterRole = "beneficiary";

      const conventionBuilder = new ConventionDtoBuilder()
        .withStatus("READY_TO_SIGN")
        .withId(conventionId)
        .build();

      await conventionRepository.save(conventionBuilder);

      await updateConventionStatus.execute(
        { status: "DRAFT", statusJustification: "because" },
        { conventionId, role: requesterRole },
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
            roles: [requesterRole],
          },
        }),
      );
    });
  });

  describe("* -> READY_TO_SIGN transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "READY_TO_SIGN",
      },
      expectedDomainTopic: null,
      allowedRoles: [
        "beneficiary",
        "establishment",
        "establishment-representative",
        "legal-representative",
        "beneficiary-representative",
        "beneficiary-current-employer",
      ],
      allowedInitialStatuses: ["DRAFT"],
    });
  });

  describe("* -> PARTIALLY_SIGNED transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "PARTIALLY_SIGNED",
      },
      expectedDomainTopic: "ImmersionApplicationPartiallySigned",
      allowedRoles: [
        "beneficiary",
        "establishment",
        "establishment-representative",
        "legal-representative",
        "beneficiary-representative",
        "beneficiary-current-employer",
      ],
      allowedInitialStatuses: ["READY_TO_SIGN", "PARTIALLY_SIGNED"],
    });
  });

  describe("* -> IN_REVIEW transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "IN_REVIEW",
      },
      expectedDomainTopic: "ImmersionApplicationFullySigned",
      allowedRoles: [
        "beneficiary",
        "establishment",
        "establishment-representative",
        "legal-representative",
        "beneficiary-representative",
        "beneficiary-current-employer",
      ],
      allowedInitialStatuses: ["PARTIALLY_SIGNED"],
    });
  });

  describe("* -> ACCEPTED_BY_COUNSELLOR transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "ACCEPTED_BY_COUNSELLOR",
      },
      expectedDomainTopic: "ImmersionApplicationAcceptedByCounsellor",
      allowedRoles: ["counsellor"],
      allowedInitialStatuses: ["IN_REVIEW"],
    });
  });

  describe("* -> ACCEPTED_BY_VALIDATOR transition", () => {
    const validationDate = new Date("2022-01-01T12:00:00.000");
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "ACCEPTED_BY_VALIDATOR",
      },
      expectedDomainTopic: "ImmersionApplicationAcceptedByValidator",
      allowedRoles: ["validator"],
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
      },
      expectedDomainTopic: "ImmersionApplicationRejected",
      updatedFields: { statusJustification: "my rejection justification" },
      allowedRoles: ["backOffice", "validator", "counsellor"],
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
      },
      expectedDomainTopic: "ImmersionApplicationCancelled",
      updatedFields: { statusJustification: "Cancelled justification" },
      allowedRoles: ["validator", "backOffice"],
      allowedInitialStatuses: ["ACCEPTED_BY_VALIDATOR"],
    });
  });

  describe("* -> DEPRECATED transition", () => {
    testForAllRolesAndInitialStatusCases({
      updateStatusParams: {
        status: "DEPRECATED",
        statusJustification: "my deprecation justification",
      },
      expectedDomainTopic: "ConventionDeprecated",
      updatedFields: { statusJustification: "my deprecation justification" },
      allowedRoles: ["backOffice", "validator", "counsellor"],
      allowedInitialStatuses: [
        "PARTIALLY_SIGNED",
        "READY_TO_SIGN",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
        "DRAFT",
      ],
    });
  });

  it("fails for unknown application ids", async () => {
    const { updateConventionStatus, conventionRepository } =
      await setupInitialState({ initialStatus: "IN_REVIEW" });
    await expectPromiseToFailWithError(
      executeUpdateConventionStatusUseCase({
        conventionId: "unknown_application_id",
        role: "validator",
        email: "test@test.fr",
        updateStatusParams: { status: "ACCEPTED_BY_VALIDATOR" },
        updateConventionStatus,
        conventionRepository,
      }),
      new NotFoundError("unknown_application_id"),
    );
  });
});
