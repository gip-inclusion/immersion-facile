import { TabsProps } from "@codegouvfr/react-dsfr/Tabs";
import { EstablishmentDashboardTab } from "shared";

export type DashboardTab = TabsProps.Controlled["tabs"][number] & {
  content: React.ReactNode;
};

export const getDashboardTabs = (
  rawTabs: DashboardTab[],
  currentTab: EstablishmentDashboardTab,
) =>
  rawTabs.map((tab) => ({
    ...tab,
    tabId: tab.tabId,
    isDefault: currentTab === tab.tabId,
  }));
