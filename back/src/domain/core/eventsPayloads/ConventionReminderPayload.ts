import { ConventionId } from "shared";
import { z } from "zod";

const reminderTypes = [
  "FirstReminderForSignatories",
  "LastReminderForSignatories",
  "FirstReminderForAgency",
  "LastReminderForAgency",
] as const;

export type ReminderType = (typeof reminderTypes)[number];

export type ConventionReminderPayload = {
  reminderType: ReminderType;
  conventionId: ConventionId;
};

export const conventionReminderPayloadSchema: z.Schema<ConventionReminderPayload> =
  z.object({
    reminderType: z.enum(reminderTypes),
    conventionId: z.string(),
  });
