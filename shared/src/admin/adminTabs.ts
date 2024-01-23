export const adminTabsList = [
  "conventions",
  "events",
  "agencies",
  "establishments",
  "notifications",
  "email-preview",
  "technical-options",
] as const;

export type AdminTab = (typeof adminTabsList)[number];
