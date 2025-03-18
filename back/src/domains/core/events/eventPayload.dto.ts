import type {
  AgencyId,
  AgencyModifierRole,
  ConventionDto,
  ConventionId,
  ReminderKind,
  Role,
  SignatoryRole,
  WithAgencyId,
  WithConventionDto,
} from "shared";

type ConventionRequireModificationCommon = {
  convention: ConventionDto;
  justification: string;
  requesterRole: Role;
};

export type AgencyActorRequestModificationPayload =
  ConventionRequireModificationCommon & {
    modifierRole: AgencyModifierRole;
    agencyActorEmail: string;
  };

export type SignatoryRequestModificationPayload =
  ConventionRequireModificationCommon & {
    modifierRole: SignatoryRole;
  };

export type ConventionRequiresModificationPayload =
  | AgencyActorRequestModificationPayload
  | SignatoryRequestModificationPayload;

export type ConventionReminderPayload = {
  reminderKind: ReminderKind;
  conventionId: ConventionId;
};

export type TransferConventionToAgencyPayload = WithConventionDto & WithAgencyId & {
  justification: string;
  previousAgencyId: AgencyId;
};