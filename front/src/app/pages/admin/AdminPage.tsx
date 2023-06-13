import React from "react";
import { fr } from "@codegouvfr/react-dsfr";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { Route } from "type-route";
import { ImmersionHeader } from "src/app/components/layout/ImmersionHeader";
import { AddEstablishmentByBatchTab } from "src/app/pages/admin/AddEstablishmentByBatchTab";
import { AgencyTab } from "src/app/pages/admin/AgencyTab";
import { ConventionTab, EventsTab } from "src/app/pages/admin/DashboardTabs";
import { EmailPreviewTab } from "src/app/pages/admin/EmailPreviewTab";
import { NotificationsTab } from "src/app/pages/admin/NotificationsTab";
import { TechnicalOptions } from "src/app/pages/admin/TechnicalOptions";
import { AdminTab, isAdminTab } from "src/app/routes/route-params";
import { routes } from "src/app/routes/routes";

type Tab = {
  label: string;
  tabId: AdminTab;
  content: JSX.Element;
};

const adminTabs: Tab[] = [
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
    tabId: "agency-validation",
    content: <AgencyTab />,
  },
  {
    label: "Options techniques",
    tabId: "technical-options",
    content: <TechnicalOptions />,
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
    label: "Ajout d'établissements groupés",
    tabId: "establishment-batch",
    content: <AddEstablishmentByBatchTab />,
  },
];

export const AdminPage = ({
  route,
}: {
  route: Route<typeof routes.adminTab>;
}) => {
  const currentTab = route.params.tab;

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
              selectedTabId={currentTab}
              tabs={adminTabs}
              onTabChange={(tab) => {
                if (isAdminTab(tab))
                  routes
                    .adminTab({
                      tab,
                    })
                    .push();
              }}
            >
              <div>
                {adminTabs.find((tab) => tab.tabId === currentTab)?.content}
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};
