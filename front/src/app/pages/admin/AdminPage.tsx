import React from "react";
// import { NavLink, TabLinks } from "react-design-system";
import { ImmersionHeader } from "src/app/components/layout/ImmersionHeader";
import { AddEstablishmentByBatchTab } from "src/app/pages/admin/AddEstablishmentByBatchTab";
import { AgencyTab } from "src/app/pages/admin/AgencyTab";
import { ConventionTab, EventsTab } from "src/app/pages/admin/DashboardTabs";
import { DataExportTab } from "src/app/pages/admin/DataExportTab";
import { EmailPreviewTab } from "src/app/pages/admin/EmailPreviewTab";
import { EmailsTab } from "src/app/pages/admin/EmailsTab";
import { TechnicalOptions } from "src/app/pages/admin/TechnicalOptions";
// import { AdminTab } from "src/app/routes/route-params";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";
import { fr } from "@codegouvfr/react-dsfr";
import { Tabs } from "@codegouvfr/react-dsfr/Tabs";
import { AdminTab, isAdminTab } from "src/app/routes/route-params";
// import { useState } from "react";

// const getAdminNavLinkId = (chunk: string) => `im-admin-nav__${chunk}`;

// const getNavLinks = (currentTab: AdminTab): NavLink[] => [
//   {
//     label: "Conventions",
//     active: currentTab === "conventions",
//     ...routes.adminTab({ tab: "conventions" }).link,
//     id: getAdminNavLinkId("conventions"),
//   },
//   {
//     label: "Evénements",
//     active: currentTab === "events",
//     ...routes.adminTab({ tab: "events" }).link,
//     id: getAdminNavLinkId("events"),
//   },
//   {
//     label: "Agences",
//     active: currentTab === "agency-validation",
//     ...routes.adminTab({ tab: "agency-validation" }).link,
//     id: getAdminNavLinkId("agency-validation"),
//   },
//   {
//     label: "Export de données",
//     active: currentTab === "exports",
//     ...routes.adminTab({ tab: "exports" }).link,
//     id: getAdminNavLinkId("exports"),
//   },
//   {
//     label: "Options techniques",
//     active: currentTab === "technical-options",
//     ...routes.adminTab({ tab: "technical-options" }).link,
//     id: getAdminNavLinkId("technical-options"),
//   },
//   ...(ENV.envType !== "production"
//     ? [
//         {
//           label: "Emails",
//           active: currentTab === "emails",
//           ...routes.adminTab({ tab: "emails" }).link,
//           id: getAdminNavLinkId("emails"),
//         },
//       ]
//     : []),
//   {
//     label: "Aperçu email",
//     active: currentTab === "email-preview",
//     ...routes.adminTab({ tab: "email-preview" }).link,
//     id: getAdminNavLinkId("email-preview"),
//   },
//   {
//     label: "Ajout d'établissements groupés",
//     active: currentTab === "establishment-batch",
//     ...routes.adminTab({ tab: "establishment-batch" }).link,
//     id: getAdminNavLinkId("establishment-batch"),
//   },
// ];

// const tabsByName: Record<AdminTab, () => JSX.Element> = {
//   "agency-validation": () => <AgencyTab />,
//   "email-preview": () => <EmailPreviewTab />,
//   "establishment-batch": () => <AddEstablishmentByBatchTab />,
//   "technical-options": () => <TechnicalOptions />,
//   conventions: () => <ConventionTab />,
//   emails: () => <EmailsTab />,
//   events: () => <EventsTab />,
//   exports: () => <DataExportTab />,
// };

export const AdminPage = ({
  route,
}: {
  route: Route<typeof routes.adminTab>;
}) => {
  const currentTab = route.params.tab;
  // const [selectedTabId, setSelectedTabId] = useState(route.params.tab);

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
            {/* <TabLinks
              navLinks={getNavLinks(currentTab)}
              navWrapper={{
                role: "navigation",
                id: "menu-admin",
                className: "fr-nav fr-nav--admin",
                ariaLabel: "Menu admin",
                style: {
                  marginBottom: "1.5rem",
                },
              }}
            />
            <div>{tabsByName[currentTab]()}</div> */}
            {/* <Tabs tabs={reactDsfrAdminTabsAutoManaged}></Tabs> */}
            <Tabs
              selectedTabId={currentTab}
              tabs={
                reactDsfrAdminTabsAutoManaged
                //   .filter(
                //   (tab) => tab.tabId !== "emails" ?? ENV.envType === "production",
                // )
              }
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
                {
                  reactDsfrAdminTabsAutoManaged.find(
                    (tab) => tab.tabId === currentTab,
                  )?.content
                }
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
};

type Tab = {
  label: string;
  tabId: AdminTab;
  content: JSX.Element;
};

const reactDsfrAdminTabsAutoManaged: Tab[] = [
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
    label: "Export de données",
    tabId: "exports",
    content: <DataExportTab />,
  },
  {
    label: "Options techniques",
    tabId: "technical-options",
    content: <TechnicalOptions />,
  },
  {
    label: "Emails",
    tabId: "emails",
    content: <EmailsTab />,
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

// const reactDsfrAdminManual = [
//   {
//     label: "Conventions",
//     ...routes.adminTab({ tab: "conventions" }).link,
//     tabId: getAdminNavLinkId("conventions"),
//   },
//   {
//     label: "Evénements",
//     ...routes.adminTab({ tab: "events" }).link,
//     tabId: getAdminNavLinkId("events"),
//   },
//   {
//     label: "Agences",
//     ...routes.adminTab({ tab: "agency-validation" }).link,
//     tabId: getAdminNavLinkId("agency-validation"),
//   },
//   {
//     label: "Export de données",
//     ...routes.adminTab({ tab: "exports" }).link,
//     tabId: getAdminNavLinkId("exports"),
//   },
//   {
//     label: "Options techniques",
//     ...routes.adminTab({ tab: "technical-options" }).link,
//     tabId: getAdminNavLinkId("technical-options"),
//   },
//   ...(ENV.envType !== "production"
//     ? [
//         {
//           label: "Emails",
//           ...routes.adminTab({ tab: "emails" }).link,
//           tabId: getAdminNavLinkId("emails"),
//         },
//       ]
//     : []),
//   {
//     label: "Aperçu email",
//     ...routes.adminTab({ tab: "email-preview" }).link,
//     tabId: getAdminNavLinkId("email-preview"),
//   },
//   {
//     label: "Ajout d'établissements groupés",
//     ...routes.adminTab({ tab: "establishment-batch" }).link,
//     tabId: getAdminNavLinkId("establishment-batch"),
//   },
// ];
