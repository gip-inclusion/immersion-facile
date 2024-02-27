import {
  AgencyModifierRole,
  ConventionDto,
  ConventionId,
  Role,
  SignatoryRole,
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

export const reminderKinds = [
  "FirstReminderForSignatories",
  "LastReminderForSignatories",
  "FirstReminderForAgency",
  "LastReminderForAgency",
] as const;

export type ReminderKind = (typeof reminderKinds)[number];

export type ConventionReminderPayload = {
  reminderKind: ReminderKind;
  conventionId: ConventionId;
};
