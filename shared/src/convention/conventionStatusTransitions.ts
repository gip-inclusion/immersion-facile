import { Role } from "..";
import { ConventionStatus } from "./convention.dto";

export type StatusTransitionConfig = {
  validInitialStatuses: ConventionStatus[];
  validRoles: Role[];
};

const validSignatoryRoles: Role[] = [
  "beneficiary",
  "establishment",
  "beneficiary-representative",
  "beneficiary-current-employer",
  "establishment-representative",
  "legal-representative",
];

export const statusTransitionConfigs: Record<
  ConventionStatus,
  StatusTransitionConfig
> = {
  READY_TO_SIGN: {
    validInitialStatuses: ["DRAFT"],
    validRoles: validSignatoryRoles,
  },

  PARTIALLY_SIGNED: {
    validInitialStatuses: ["READY_TO_SIGN", "PARTIALLY_SIGNED"],
    validRoles: validSignatoryRoles,
  },

  IN_REVIEW: {
    validInitialStatuses: ["PARTIALLY_SIGNED"],
    validRoles: validSignatoryRoles,
  },

  ACCEPTED_BY_COUNSELLOR: {
    validInitialStatuses: ["IN_REVIEW"],
    validRoles: ["counsellor"],
  },
  ACCEPTED_BY_VALIDATOR: {
    validInitialStatuses: ["IN_REVIEW", "ACCEPTED_BY_COUNSELLOR"],
    validRoles: ["validator"],
  },

  // This config allows a counsellor to reject or cancel a Convention after it been
  // accepted by a validator. Should we be stricter? We assume that this is a
  // rare edge case that can be addressed at a later stage.
  REJECTED: {
    validInitialStatuses: [
      "IN_REVIEW",
      "READY_TO_SIGN",
      "PARTIALLY_SIGNED",
      "ACCEPTED_BY_COUNSELLOR",
    ],
    validRoles: ["counsellor", "validator", "backOffice"],
  },
  CANCELLED: {
    validInitialStatuses: ["ACCEPTED_BY_VALIDATOR"],
    validRoles: ["validator", "backOffice"],
  },
  // This enables the "require modifications" flow. The agents can put the request
  // back in the draft state for the beneficiary to modify the request and reapply.
  // Also enables the company/beneficiary to request modifications and revoke signatures
  DRAFT: {
    validInitialStatuses: [
      "READY_TO_SIGN",
      "PARTIALLY_SIGNED",
      "IN_REVIEW",
      "ACCEPTED_BY_COUNSELLOR",
    ],
    validRoles: [
      "counsellor",
      "validator",
      "backOffice",
      ...validSignatoryRoles,
    ],
  },
};
