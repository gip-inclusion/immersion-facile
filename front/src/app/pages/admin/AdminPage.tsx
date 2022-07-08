import React from "react";
import { Tabs } from "react-design-system/immersionFacile";
import { ImmersionMarianneHeader } from "src/app/components/ImmersionMarianneHeader";
import { AdminRoute } from "src/app/pages/admin/AdminRoute";
import { AgencyTab } from "src/app/pages/admin/AgencyTab";
import { ConventionTab } from "src/app/pages/admin/ConventionTab";
import { DataExportTab } from "src/app/pages/admin/DataExportTab";
import { EmailsTab } from "src/app/pages/admin/EmailsTab";
import { ENV } from "src/environmentVariables";
import "./Admin.css";

const { dev } = ENV;

export const AdminPage = ({ route }: { route: AdminRoute }) => {
  const prodTabContent = {
    Conventions: <ConventionTab route={route} />,
    Agences: <AgencyTab />,
    "Export de données": <DataExportTab />,
  };
  const devOnlyTabContent = {
    Emails: <EmailsTab />,
  };

  return (
    <>
      <ImmersionMarianneHeader />

      <div className="fr-grid-row fr-grid-row--center fr-grid-row--gutters">
        <div className="fr-col-lg-8 fr-p-2w mt-4" style={{ width: "95%" }}>
          <Tabs
            content={
              dev ? { ...prodTabContent, ...devOnlyTabContent } : prodTabContent
            }
          />
        </div>
      </div>
    </>
  );
};
