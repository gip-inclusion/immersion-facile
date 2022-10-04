/* eslint-disable jest/require-top-level-describe */
/* eslint-disable jest/consistent-test-it */

import { expectPromiseToFailWithError } from "../../../_testBuilders/test.helpers";
import { NotFoundError } from "../../../adapters/primary/helpers/httpErrors";
import {
  executeUpdateConventionStatusUseCase,
  setupInitialState,
  testForAllRolesAndInitialStatusCases,
} from "./UpdateConventionStatus.testHelpers";

describe("UpdateConventionStatus", () => {
  describe("* -> DRAFT transition", () => {
    testForAllRolesAndInitialStatusCases({
      targetStatus: "DRAFT",
      expectedDomainTopic: "ImmersionApplicationRequiresModification",
      justification: "test justification",
      updatedFields: {
        establishmentRepresentativeSignedAt: undefined,
        beneficiarySignedAt: undefined,
      },
      allowedRoles: [
        "beneficiary",
        "establishment2",
        "establishment-representative",
        "legal-representative2",
        "beneficiary-representative",
        "counsellor",
        "validator",
        "admin",
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
      targetStatus: "READY_TO_SIGN",
      expectedDomainTopic: null,
      allowedRoles: [
        "beneficiary",
        "establishment2",
        "establishment-representative",
        "legal-representative2",
        "beneficiary-representative",
      ],
      allowedInitialStatuses: ["DRAFT"],
    });
  });

  describe("* -> PARTIALLY_SIGNED transition", () => {
    testForAllRolesAndInitialStatusCases({
      targetStatus: "PARTIALLY_SIGNED",
      expectedDomainTopic: "ImmersionApplicationPartiallySigned",
      allowedRoles: [
        "beneficiary",
        "establishment2",
        "establishment-representative",
        "legal-representative2",
        "beneficiary-representative",
      ],
      allowedInitialStatuses: ["READY_TO_SIGN", "PARTIALLY_SIGNED"],
    });
  });

  describe("* -> IN_REVIEW transition", () => {
    testForAllRolesAndInitialStatusCases({
      targetStatus: "IN_REVIEW",
      expectedDomainTopic: "ImmersionApplicationFullySigned",
      allowedRoles: [
        "beneficiary",
        "establishment2",
        "establishment-representative",
        "legal-representative2",
        "beneficiary-representative",
      ],
      allowedInitialStatuses: ["PARTIALLY_SIGNED"],
    });
  });

  describe("* -> ACCEPTED_BY_COUNSELLOR transition", () => {
    testForAllRolesAndInitialStatusCases({
      targetStatus: "ACCEPTED_BY_COUNSELLOR",
      expectedDomainTopic: "ImmersionApplicationAcceptedByCounsellor",
      allowedRoles: ["counsellor"],
      allowedInitialStatuses: ["IN_REVIEW"],
    });
  });

  describe("* -> ACCEPTED_BY_VALIDATOR transition", () => {
    const validationDate = new Date("2022-01-01T12:00:00.000");
    testForAllRolesAndInitialStatusCases({
      targetStatus: "ACCEPTED_BY_VALIDATOR",
      expectedDomainTopic: "ImmersionApplicationAcceptedByValidator",
      allowedRoles: ["validator"],
      allowedInitialStatuses: ["IN_REVIEW", "ACCEPTED_BY_COUNSELLOR"],
      updatedFields: { dateValidation: validationDate.toISOString() },
      nextDate: validationDate,
    });
  });

  describe("* -> REJECTED transition", () => {
    testForAllRolesAndInitialStatusCases({
      targetStatus: "REJECTED",
      expectedDomainTopic: "ImmersionApplicationRejected",
      justification: "my rejection justification",
      updatedFields: { rejectionJustification: "my rejection justification" },
      allowedRoles: ["admin", "validator", "counsellor"],
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
      targetStatus: "CANCELLED",
      expectedDomainTopic: "ImmersionApplicationCancelled",
      allowedRoles: ["counsellor", "validator", "admin"],
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
        targetStatus: "ACCEPTED_BY_VALIDATOR",
        updateConventionStatus,
        conventionRepository,
      }),
      new NotFoundError("unknown_application_id"),
    );
  });
});
