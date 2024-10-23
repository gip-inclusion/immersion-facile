import { Alert } from "@codegouvfr/react-dsfr/Alert";
import React from "react";
import { useAdminToken } from "src/app/hooks/jwt.hooks";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";
import { ConventionManageContent } from "../../components/admin/conventions/ConventionManageContent";

type ConventionManageAdminPageProps = {
  route: Route<typeof routes.adminConventionDetail>;
};

export const AdminConventionDetail = ({
  route,
}: ConventionManageAdminPageProps) => {
  const conventionId = route.params.conventionId;
  const backOfficeJwt = useAdminToken();

  return backOfficeJwt ? (
    <ConventionManageContent
      jwtParams={{ jwt: backOfficeJwt, kind: "backoffice" }}
      conventionId={conventionId}
    />
  ) : (
    <Alert
      severity="error"
      title="Non autorisé"
      description="Cette page est reservée aux administrateurs d'Immersion Facilitée."
    />
  );
};
