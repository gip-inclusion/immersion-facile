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
    link: routes.admin({ tab: "conventions" }).link,
    label: "Conventions",
    active: currentTab === "conventions",
  },
  {
    link: routes.admin({ tab: "agency-validation" }).link,
    label: "Agences",
    active: currentTab === "agency-validation",
  },
  {
    link: routes.admin({ tab: "exports" }).link,
    label: "Export de données",
    active: currentTab === "exports",
  },
  {
    link: routes.admin({ tab: "emails" }).link,
    label: "Emails",
    active: currentTab === "emails",
  },
];

export const AdminPage = ({ route }: { route: Route<typeof routes.admin> }) => {
  const currentTab = route.params.tab;

  return (
    <>
      <ImmersionMarianneHeader />

      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        <div className="fr-col-lg-8 fr-p-2w mt-4" style={{ width: "95%" }}>
          <TabLinks navLinks={getNavLinks(currentTab)} />
          <br />
          {currentTab === "conventions" && <ConventionTab />}
          {currentTab === "agency-validation" && <AgencyTab />}
          {currentTab === "exports" && <DataExportTab />}
          {currentTab === "emails" && <EmailsTab />}
        </div>
      </div>
    </>
  );
};
