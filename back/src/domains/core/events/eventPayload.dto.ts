import type {
  AgencyId,
  ConventionId,
  ReminderKind,
  WithAgencyId,
  WithConventionId,
} from "shared";

export type ConventionReminderPayload = {
  reminderKind: ReminderKind;
  conventionId: ConventionId;
};

export type TransferConventionToAgencyPayload = WithConventionId &
  WithAgencyId & {
    justification: string;
    previousAgencyId: AgencyId;
  };
