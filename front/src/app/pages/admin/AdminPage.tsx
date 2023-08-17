import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Tabs, TabsProps } from "@codegouvfr/react-dsfr/Tabs";
import { Route } from "type-route";
import { ImmersionHeader } from "src/app/components/layout/ImmersionHeader";
import { AgencyTab } from "src/app/pages/admin/AgencyTab";
import { ConventionTab } from "src/app/pages/admin/ConventionTab";
import { EmailPreviewTab } from "src/app/pages/admin/EmailPreviewTab";
import { EstablishmentsTab } from "src/app/pages/admin/EstablishmentsTab";
import { EventsTab } from "src/app/pages/admin/EventsTabs";
import { NotificationsTab } from "src/app/pages/admin/NotificationsTab";
import { TechnicalOptions } from "src/app/pages/admin/TechnicalOptions";
import { AdminTab, isAdminTab } from "src/app/routes/routeParams/adminTabs";
import { routes } from "src/app/routes/routes";

const rawAdminTabs: Array<
  TabsProps.Controlled["tabs"][number] & { content: React.ReactNode }
> = [
  {
    label: "Conventions",
    tabId: "conventions",
    content: <ConventionTab />,
  },
  {
    label: "Evénements",
    tabId: "events",
    content: <EventsTab />,
  },
  {
    label: "Agences",
    tabId: "agencies",
    content: <AgencyTab />,
  },
  {
    label: "Établissements",
    tabId: "establishments",
    content: <EstablishmentsTab />,
  },
  {
    label: "Notifications",
    tabId: "notifications",
    content: <NotificationsTab />,
  },
  {
    label: "Aperçu email",
    tabId: "email-preview",
    content: <EmailPreviewTab />,
  },
  {
    label: "Options techniques",
    tabId: "technical-options",
    content: <TechnicalOptions />,
  },
];

const getAdminTabs = (currentTab: AdminTab) =>
  rawAdminTabs.map((tab) => ({
    ...tab,
    tabId: tab.tabId,
    isDefault: currentTab === tab.tabId,
  }));

export const AdminPage = ({
  route,
}: {
  route: Route<typeof routes.adminTab>;
}) => {
  const currentTab = route.params.tab;
  const tabs = getAdminTabs(currentTab);
  return (
    <>
      <ImmersionHeader />
      <div className={fr.cx("fr-container")}>
        <div
          className={fr.cx(
            "fr-grid-row",
            "fr-grid-row--center",
            "fr-grid-row--gutters",
          )}
        >
          <div className={fr.cx("fr-col-12", "fr-p-2w", "fr-mt-4w")}>
            <Tabs
              tabs={tabs}
              selectedTabId={currentTab} // shouldn't be necessary as it's handled by isDefault, but typescript complains (should report to react-dsfr)
              onTabChange={(tab) => {
                if (isAdminTab(tab))
                  routes
                    .adminTab({
                      tab,
                    })
                    .push();
              }}
            >
              {tabs.find((tab) => tab.tabId === currentTab)?.content}
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};
