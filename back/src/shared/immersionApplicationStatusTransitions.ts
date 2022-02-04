import { ApplicationStatus } from "./ImmersionApplicationDto";
import { Role } from "./tokens/MagicLinkPayload";

export type StatusTransitionConfig = {
  validInitialStatuses: ApplicationStatus[];
  validRoles: Role[];
};

export const statusTransitionConfigsEnterpriseSign: Partial<
  Record<ApplicationStatus, StatusTransitionConfig>
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
      "ACCEPTED_BY_VALIDATOR",
      "ACCEPTED_BY_COUNSELLOR",
    ],
    validRoles: ["counsellor", "validator", "admin"],
  },

  // This enables the "require modifications" flow. The agents can put the request
  // back in the draft state for the beneficiary to modify the request and reapply.
  // Also enables the company/beneficiary to request modifications and revoke signatures
  DRAFT: {
    validInitialStatuses: [
      "IN_REVIEW",
      "ACCEPTED_BY_VALIDATOR",
      "ACCEPTED_BY_COUNSELLOR",
      "READY_TO_SIGN",
      "PARTIALLY_SIGNED",
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
