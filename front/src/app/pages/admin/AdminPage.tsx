import { Tabs, TabsProps } from "@codegouvfr/react-dsfr/Tabs";
import React from "react";
import {
  AdminTabRouteName,
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
import { UsersTab } from "src/app/pages/admin/UsersTab";
import { routes } from "src/app/routes/routes";
import { ENV } from "src/config/environmentVariables";
import { Route } from "type-route";

type RawAdminTab = Prettify<
  OmitFromExistingKeys<TabsProps.Controlled["tabs"][number], "tabId"> & {
    content: React.ReactNode;
  }
>;

const rawAdminTabs: Record<AdminTabRouteName, RawAdminTab> = {
  adminConventions: {
    label: "Conventions",
    content: <ConventionTab />,
  },
  adminEvents: {
    label: "Evénements",
    content: <EventsTab />,
  },
  adminAgencies: {
    label: "Agences",
    content: <AgencyTab />,
  },
  adminUsers: {
    label: "Utilisateurs",
    content: <UsersTab />,
  },
  adminEstablishments: {
    label: "Établissements",
    content: <EstablishmentsTab />,
  },
  adminNotifications: {
    label: "Notifications",
    content: <NotificationsTab />,
  },
  adminEmailPreview: {
    label: "Aperçu email",
    content: <EmailPreviewTab />,
  },
  adminTechnicalOptions: {
    label: "Options techniques",
    content: <TechnicalOptionsTab />,
  },
};

export type FrontAdminRoute = Route<(typeof routes)[AdminTabRouteName]>;

const getAdminTabs = (currentTab: AdminTabRouteName) =>
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
  route: FrontAdminRoute;
}) => {
  const currentTab = route.name;
  const tabs = getAdminTabs(route.name);

  return (
    <Tabs
      tabs={tabs}
      selectedTabId={currentTab} // shouldn't be necessary as it's handled by isDefault, but typescript complains (should report to react-dsfr)
      onTabChange={(tab) => {
        routes[tab as AdminTabRouteName]().push();
      }}
      id="admin-tabs"
    >
      {tabs.find((tab) => tab.tabId === currentTab)?.content}
    </Tabs>
  );
};
