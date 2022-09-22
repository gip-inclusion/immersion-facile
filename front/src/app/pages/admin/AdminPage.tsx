import React from "react";
import { NavLink, TabLinks } from "react-design-system/immersionFacile";
import { ImmersionMarianneHeader } from "src/app/components/ImmersionMarianneHeader";
import { AgencyTab } from "src/app/pages/admin/AgencyTab";
import { ConventionTab } from "src/app/pages/admin/ConventionTab";
import { DataExportTab } from "src/app/pages/admin/DataExportTab";
import { EmailsTab } from "src/app/pages/admin/EmailsTab";
import { AdminTab } from "src/app/routing/route-params";
import { routes } from "src/app/routing/routes";
import { Route } from "type-route";
import "./Admin.css";

const getNavLinks = (currentTab: AdminTab): NavLink[] => [
  {
    label: "Conventions",
    active: currentTab === "conventions",
    ...routes.adminTab({ tab: "conventions" }).link,
  },
  {
    label: "Agences",
    active: currentTab === "agency-validation",
    ...routes.adminTab({ tab: "agency-validation" }).link,
  },
  {
    label: "Export de données",
    active: currentTab === "exports",
    ...routes.adminTab({ tab: "exports" }).link,
  },
  {
    label: "Emails",
    active: currentTab === "emails",
    ...routes.adminTab({ tab: "emails" }).link,
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
      <ImmersionMarianneHeader />
      <div className="fr-container">
        <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
          <div className="fr-col fr-p-2w mt-4">
            <TabLinks
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
            <div className="fr-tab-content">
              {currentTab === "conventions" && <ConventionTab />}
              {currentTab === "agency-validation" && <AgencyTab />}
              {currentTab === "exports" && <DataExportTab />}
              {currentTab === "emails" && <EmailsTab />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
