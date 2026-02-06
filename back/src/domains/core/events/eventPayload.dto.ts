import type {
  AgencyId,
  ConventionId,
  ReminderKind,
  WithAgencyId,
  WithConventionDto,
} from "shared";

export type ConventionReminderPayload = {
  reminderKind: ReminderKind;
  conventionId: ConventionId;
};

export type TransferConventionToAgencyPayload = WithConventionDto &
  WithAgencyId & {
    justification: string;
    previousAgencyId: AgencyId;
    shouldNotifyActors: boolean;
  };
