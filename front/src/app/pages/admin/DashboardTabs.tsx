import React from "react";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useAdminDashboard } from "src/app/pages/admin/useAdminDashboard";
import { Alert } from "@codegouvfr/react-dsfr/Alert";

export const ConventionTab = () => {
  const { url, error } = useAdminDashboard({ name: "conventions" });

  return error ? (
    <Alert severity="error" title="Erreur" description={error} />
  ) : (
    <MetabaseView title="Conventions" url={url} />
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
