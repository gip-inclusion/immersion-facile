import type { Role } from "../role/role.dto";
import type { ConventionReadDto, ConventionStatus } from "./convention.dto";

export type StatusTransitionConfig = {
  validInitialStatuses: ConventionStatus[];
  validRoles: Role[];
  refine?: (conventionRead: ConventionReadDto) => {
    isError: boolean;
    errorMessage: string;
  };
};

export const validSignatoryRoles: Role[] = [
  "beneficiary",
  "beneficiary-representative",
  "beneficiary-current-employer",
  "establishment-representative",
];

export const statusTransitionConfigs: Record<
  ConventionStatus,
  StatusTransitionConfig
> = {
  READY_TO_SIGN: {
    validInitialStatuses: [
      "READY_TO_SIGN",
      "PARTIALLY_SIGNED",
      "IN_REVIEW",
      "ACCEPTED_BY_COUNSELLOR",
    ],
    validRoles: [
      "counsellor",
      "validator",
      "back-office",
      ...validSignatoryRoles,
    ],
    refine: (conventionRead) => {
      const renewedKey: keyof ConventionReadDto = "renewed";
      return {
        isError: renewedKey in conventionRead,
        errorMessage: "Cannot edit a renewed convention",
      };
    },
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
    refine: (conventionRead) => ({
      isError:
        conventionRead.status === "IN_REVIEW" &&
        conventionRead.agencyCounsellorEmails.length > 0,
      errorMessage: `Vous ne pouvez pas valider la convention: '${conventionRead.id}', elle doit d'abord être revue et marquée comme éligible par un conseiller.`,
    }),
  },

  // This config allows a counsellor to reject or cancel a Convention after it been
  // accepted by a validator. Should we be stricter? We assume that this is a
  // rare edge case that can be addressed at a later stage.
  REJECTED: {
    validInitialStatuses: [
      "READY_TO_SIGN",
      "PARTIALLY_SIGNED",
      "IN_REVIEW",
      "ACCEPTED_BY_COUNSELLOR",
    ],
    validRoles: ["counsellor", "validator", "back-office"],
  },
  CANCELLED: {
    validInitialStatuses: ["ACCEPTED_BY_VALIDATOR"],
    validRoles: ["validator", "back-office", "counsellor"],
  },

  DEPRECATED: {
    validInitialStatuses: [
      "ACCEPTED_BY_COUNSELLOR",
      "IN_REVIEW",
      "PARTIALLY_SIGNED",
      "READY_TO_SIGN",
    ],
    validRoles: ["counsellor", "validator", "back-office"],
  },
};
