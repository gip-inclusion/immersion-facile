import { ConventionId } from "shared";
import { z } from "zod";

const reminderTypes = [
  "FirstReminderForSignatories",
  "LastReminderForSignatories",
  "FirstReminderForAgency",
  "LastReminderForAgency",
] as const;

export type ReminderType = (typeof reminderTypes)[number];

export type ConventionSignReminderPayload = {
  type: ReminderType;
  conventionId: ConventionId;
};

export const conventionSignReminderPayloadSchema: z.Schema<ConventionSignReminderPayload> =
  z.object({
    type: z.enum(reminderTypes),
    conventionId: z.string(),
  });
