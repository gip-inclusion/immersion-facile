import { ValueSerializer } from "type-route";
import { AdminTab, adminTabsList } from "shared";

export const isAdminTab = (input: string): input is AdminTab =>
  adminTabsList.includes(input as AdminTab);

export const adminTabSerializer: ValueSerializer<AdminTab> = {
  parse: (raw) => raw as AdminTab,
  stringify: (tab) => tab,
};
