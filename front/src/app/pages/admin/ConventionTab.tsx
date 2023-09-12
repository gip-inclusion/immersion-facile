import React from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { MetabaseView } from "src/app/components/MetabaseView";
import { ManageConventionFormSection } from "src/app/pages/admin/ManageConventionFormSection";
import { useAdminDashboard } from "src/app/pages/admin/useAdminDashboard";

export const ConventionTab = () => {
  const { url, error } = useAdminDashboard({ name: "conventions" });
  return error ? (
    <Alert severity="error" title="Erreur" description={error} />
  ) : (
    <>
      <ManageConventionFormSection
        routeNameToRedirectTo={"manageConventionAdmin"}
      />
      <MetabaseView title="Consulter les conventions" url={url} />
    </>
  );
};
