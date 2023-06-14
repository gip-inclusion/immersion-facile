import { ValueSerializer } from "type-route";

export const adminTabs = [
  "conventions",
  "events",
  "agency-validation",
  "exports",
  "notifications",
  "technical-options",
  "email-preview",
  "establishment-batch",
] as const;

export type AdminTab = (typeof adminTabs)[number];

export const isAdminTab = (input: string): input is AdminTab =>
  adminTabs.includes(input as AdminTab);

export const adminTabSerializer: ValueSerializer<AdminTab> = {
  parse: (raw) => raw as AdminTab,
  stringify: (tab) => tab,
};
