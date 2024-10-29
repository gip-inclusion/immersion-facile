import { Alert } from "@codegouvfr/react-dsfr/Alert";
import React from "react";
import { MetabaseView } from "src/app/components/MetabaseView";
import { useAdminDashboard } from "src/app/pages/admin/useAdminDashboard";

export const ConventionTab = () => {
  const { url, error } = useAdminDashboard({ name: "conventions" });
  return error ? (
    <Alert severity="error" title="Erreur" description={error} />
  ) : (
    <MetabaseView
      title="Consulter les conventions"
      subtitle="Cliquer sur l'identifiant de la convention pour y accéder."
      url={url}
    />
  );
};
