import type { TabsProps } from "@codegouvfr/react-dsfr/Tabs";
import type { ReactNode } from "react";
import type { EstablishmentDashboardTab } from "shared";

export type DashboardTab = TabsProps.Controlled["tabs"][number] & {
  content: ReactNode;
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
