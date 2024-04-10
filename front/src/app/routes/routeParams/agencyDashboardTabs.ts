import { AgencyDashboardTab, agencyDashboardTabsList } from "shared";
import { ValueSerializer } from "type-route";

export const icUserAgencyDashboardTabSerializer: ValueSerializer<AgencyDashboardTab> =
  {
    parse: (raw) => raw as AgencyDashboardTab,
    stringify: (tab) => tab,
  };

export const isAgencyDashboardTab = (
  input: string,
): input is AgencyDashboardTab =>
  agencyDashboardTabsList.includes(input as AgencyDashboardTab);
