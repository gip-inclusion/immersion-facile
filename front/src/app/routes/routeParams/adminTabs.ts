import { ValueSerializer } from "type-route";

export const adminTabs = [
  "conventions",
  "events",
  "agencies",
  "establishments",
  "notifications",
  "email-preview",
  "technical-options",
] as const;

export type AdminTab = (typeof adminTabs)[number];

export const isAdminTab = (input: string): input is AdminTab =>
  adminTabs.includes(input as AdminTab);

export const adminTabSerializer: ValueSerializer<AdminTab> = {
  parse: (raw) => raw as AdminTab,
  stringify: (tab) => tab,
};
