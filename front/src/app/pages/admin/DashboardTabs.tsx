import { Alert } from "@codegouvfr/react-dsfr/Alert";
import React from "react";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useAdminDashboard } from "src/app/pages/admin/useAdminDashboard";
import { ManageConventionAdminFormSection } from "./ManageConventionAdminFormSection";

export const ConventionTab = () => {
  const { url, error } = useAdminDashboard({ name: "conventions" });
  return error ? (
    <Alert severity="error" title="Erreur" description={error} />
  ) : (
    <>
      <ManageConventionAdminFormSection />
      <MetabaseView title="Consulter les conventions" url={url} />
    </>
  );
};

export const EventsTab = () => {
  const { url, error } = useAdminDashboard({ name: "events" });
  return error ? (
    <Alert severity="error" title="Erreur" description={error} />
  ) : (
    <MetabaseView title="Evénements" url={url} />
  );
};
