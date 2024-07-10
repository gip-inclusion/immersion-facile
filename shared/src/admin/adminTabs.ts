export const adminTabsList = [
  "conventions",
  "events",
  "agencies",
  "establishments",
  "notifications",
  "email-preview",
  "technical-options",
] as const;
export type AdminTabList = typeof adminTabsList;
export type AdminTab = AdminTabList[number];
