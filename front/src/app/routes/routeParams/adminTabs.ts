import { AdminTab, adminTabsList } from "shared";
import { ValueSerializer } from "type-route";

export const isAdminTab = (input: string): input is AdminTab =>
  adminTabsList.includes(input as AdminTab);

export const adminTabSerializer: ValueSerializer<AdminTab> = {
  parse: (raw) => raw as AdminTab,
  stringify: (tab) => tab,
};
