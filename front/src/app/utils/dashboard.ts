import { TabsProps } from "@codegouvfr/react-dsfr/Tabs";
import { AgencyDashboardTab, EstablishmentDashboardTab } from "shared";

export type DashboardTab = TabsProps.Controlled["tabs"][number] & {
  content: React.ReactNode;
};

export const getDashboardTabs = (
  rawTabs: DashboardTab[],
  currentTab: EstablishmentDashboardTab | AgencyDashboardTab,
) =>
  rawTabs.map((tab) => ({
    ...tab,
    tabId: tab.tabId,
    isDefault: currentTab === tab.tabId,
  }));
