/* eslint-disable jest/require-top-level-describe */
/* eslint-disable jest/consistent-test-it */

import { expectPromiseToFailWithError } from "shared";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
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
        justification: "test justification",
      },
      expectedDomainTopic: "ImmersionApplicationRequiresModification",
      updatedFields: {
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
        justification: "my rejection justification",
      },
      expectedDomainTopic: "ImmersionApplicationRejected",
      updatedFields: { rejectionJustification: "my rejection justification" },
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
      },
      expectedDomainTopic: "ImmersionApplicationCancelled",
      allowedRoles: ["counsellor", "validator", "backOffice"],
      allowedInitialStatuses: [
        "DRAFT",
        "READY_TO_SIGN",
        "PARTIALLY_SIGNED",
        "IN_REVIEW",
        "ACCEPTED_BY_COUNSELLOR",
        "REJECTED",
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
