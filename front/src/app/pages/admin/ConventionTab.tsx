import React from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { ConventionDtoBuilder, ConventionReadDto } from "shared";
import { RenewConventionForm } from "src/app/components/admin/conventions/ConventionManageActions";
import { MetabaseView } from "src/app/components/MetabaseView";
import { ManageConventionFormSection } from "src/app/pages/admin/ManageConventionFormSection";
import { useAdminDashboard } from "src/app/pages/admin/useAdminDashboard";

export const ConventionTab = () => {
  const { url, error } = useAdminDashboard({ name: "conventions" });
  const convention: ConventionReadDto = {
    ...new ConventionDtoBuilder().build(),
    agencyDepartment: "75",
    agencyId: "123456789",
    agencyName: "Agence",
  };
  return error ? (
    <Alert severity="error" title="Erreur" description={error} />
  ) : (
    <>
      <RenewConventionForm convention={convention} />

      <ManageConventionFormSection
        routeNameToRedirectTo={"manageConventionAdmin"}
      />
      <MetabaseView title="Consulter les conventions" url={url} />
    </>
  );
};
