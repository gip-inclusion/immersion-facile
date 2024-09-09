import { Tabs, TabsProps } from "@codegouvfr/react-dsfr/Tabs";
import React from "react";
import {
  AdminTab,
  OmitFromExistingKeys,
  Prettify,
  adminTabs,
  keys,
} from "shared";
import { AgencyTab } from "src/app/pages/admin/AgencyTab";
import { ConventionTab } from "src/app/pages/admin/ConventionTab";
import { EmailPreviewTab } from "src/app/pages/admin/EmailPreviewTab";
import { EstablishmentsTab } from "src/app/pages/admin/EstablishmentsTab";
import { EventsTab } from "src/app/pages/admin/EventsTabs";
import { NotificationsTab } from "src/app/pages/admin/NotificationsTab";
import { TechnicalOptionsTab } from "src/app/pages/admin/TechnicalOptionsTab";
import { isAdminTab } from "src/app/routes/routeParams/adminTabs";
import { routes } from "src/app/routes/routes";
import { ENV } from "src/config/environmentVariables";
import { Route } from "type-route";

type RawAdminTab = Prettify<
  OmitFromExistingKeys<TabsProps.Controlled["tabs"][number], "tabId"> & {
    content: React.ReactNode;
  }
>;

const rawAdminTabs: Record<AdminTab, RawAdminTab> = {
  conventions: {
    label: "Conventions",
    content: <ConventionTab />,
  },
  events: {
    label: "Evénements",
    content: <EventsTab />,
  },
  agencies: {
    label: "Agences",
    content: <AgencyTab />,
  },
  establishments: {
    label: "Établissements",
    content: <EstablishmentsTab />,
  },
  notifications: {
    label: "Notifications",
    content: <NotificationsTab />,
  },
  "email-preview": {
    label: "Aperçu email",
    content: <EmailPreviewTab />,
  },
  "technical-options": {
    label: "Options techniques",
    content: <TechnicalOptionsTab />,
  },
};

const getAdminTabs = (currentTab: AdminTab) =>
  keys(rawAdminTabs)
    .filter((tabId) => adminTabs[tabId].isVisible(ENV.envType))
    .map((tabId) => ({
      ...rawAdminTabs[tabId],
      tabId,
      isDefault: currentTab === tabId,
    }));

export const AdminPage = ({
  route,
}: {
  route: Route<typeof routes.admin>;
}) => {
  const currentTab = route.params.tab;
  const tabs = getAdminTabs(currentTab);
  return (
    <Tabs
      tabs={tabs}
      selectedTabId={currentTab} // shouldn't be necessary as it's handled by isDefault, but typescript complains (should report to react-dsfr)
      onTabChange={(tab) => {
        if (isAdminTab(tab))
          routes
            .admin({
              tab,
            })
            .push();
      }}
      id="admin-tabs"
    >
      {tabs.find((tab) => tab.tabId === currentTab)?.content}
    </Tabs>
  );
};
