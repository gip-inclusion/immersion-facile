import type {
  AgencyId,
  ConventionId,
  DelegationConventionReminderKind,
  ReminderKind,
  WithAgencyId,
  WithConventionDto,
} from "shared";

export type ConventionReminderPayload = {
  reminderKind: ReminderKind;
  conventionId: ConventionId;
};

export type DelegationConventionReminderPayload = {
  agencyId: AgencyId;
  reminderKind: DelegationConventionReminderKind;
};

export type TransferConventionToAgencyPayload = WithConventionDto &
  WithAgencyId & {
    justification: string;
    previousAgencyId: AgencyId;
    shouldNotifyActors: boolean;
  };
