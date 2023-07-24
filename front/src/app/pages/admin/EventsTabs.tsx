import React from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useAdminDashboard } from "src/app/pages/admin/useAdminDashboard";

export const EventsTab = () => {
  const { url, error } = useAdminDashboard({ name: "events" });
  return error ? (
    <Alert severity="error" title="Erreur" description={error} />
  ) : (
    <MetabaseView title="Evénements" url={url} />
  );
};
