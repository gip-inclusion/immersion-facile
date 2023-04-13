import { z } from "zod";

import { ConventionId } from "shared";

const reminderKinds = [
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

export const conventionReminderPayloadSchema: z.Schema<ConventionReminderPayload> =
  z.object({
    reminderKind: z.enum(reminderKinds),
    conventionId: z.string(),
  });
