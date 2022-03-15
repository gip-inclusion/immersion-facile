import { Role } from "./tokens/MagicLinkPayload";
import { ApplicationStatus } from "./ImmersionApplication/ImmersionApplication.dto";

export type StatusTransitionConfig = {
  validInitialStatuses: ApplicationStatus[];
  validRoles: Role[];
};

export const statusTransitionConfigs: Record<
  ApplicationStatus,
  StatusTransitionConfig
> = {
  READY_TO_SIGN: {
    validInitialStatuses: ["DRAFT"],
    validRoles: ["beneficiary", "establishment"],
  },

  PARTIALLY_SIGNED: {
    validInitialStatuses: ["READY_TO_SIGN"],
    validRoles: ["beneficiary", "establishment"],
  },

  IN_REVIEW: {
    validInitialStatuses: ["PARTIALLY_SIGNED"],
    validRoles: ["beneficiary", "establishment"],
  },

  ACCEPTED_BY_COUNSELLOR: {
    validInitialStatuses: ["IN_REVIEW"],
    validRoles: ["counsellor"],
  },
  ACCEPTED_BY_VALIDATOR: {
    validInitialStatuses: ["IN_REVIEW", "ACCEPTED_BY_COUNSELLOR"],
    validRoles: ["validator"],
  },
  VALIDATED: {
    validInitialStatuses: ["ACCEPTED_BY_COUNSELLOR", "ACCEPTED_BY_VALIDATOR"],
    validRoles: ["admin"],
  },

  // This config allows a counsellor to reject an application after it been
  // accepted by a validator. Should we be stricter? We assume that this is a
  // rare edge case that can be addressed at a later stage.
  REJECTED: {
    validInitialStatuses: [
      "IN_REVIEW",
      "READY_TO_SIGN",
      "PARTIALLY_SIGNED",
      "ACCEPTED_BY_COUNSELLOR",
      "ACCEPTED_BY_VALIDATOR",
    ],
    validRoles: ["counsellor", "validator", "admin"],
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
      "ACCEPTED_BY_VALIDATOR",
    ],
    validRoles: [
      "counsellor",
      "validator",
      "admin",
      "beneficiary",
      "establishment",
    ],
  },
};
