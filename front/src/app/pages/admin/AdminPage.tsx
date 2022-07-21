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
    href: routes.adminTab({ tab: "conventions" }).link.href,
    onClick: routes.adminTab({ tab: "conventions" }).link.onClick,
    label: "Conventions",
    active: currentTab === "conventions",
  },
  {
    href: routes.adminTab({ tab: "agency-validation" }).link.href,
    onClick: routes.adminTab({ tab: "agency-validation" }).link.onClick,
    label: "Agences",
    active: currentTab === "agency-validation",
  },
  {
    href: routes.adminTab({ tab: "exports" }).link.href,
    onClick: routes.adminTab({ tab: "exports" }).link.onClick,
    label: "Export de données",
    active: currentTab === "exports",
  },
  {
    href: routes.adminTab({ tab: "emails" }).link.href,
    onClick: routes.adminTab({ tab: "emails" }).link.onClick,
    label: "Emails",
    active: currentTab === "emails",
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

      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        <div className="fr-col-lg-8 fr-p-2w mt-4">
          <TabLinks
            navLinks={getNavLinks(currentTab)}
            navWrapper={{
              role: "navigation",
              id: "menu-admin",
              className: "fr-nav fr-nav--admin",
              ariaLabel: "Menu admin",
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
    </>
  );
};
