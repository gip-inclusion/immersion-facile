import React from "react";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Route } from "type-route";
import { MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAdminToken } from "src/app/hooks/jwt.hooks";
import { routes } from "src/app/routes/routes";
import { ConventionManageContent } from "../../components/admin/conventions/ConventionManageContent";

type ConventionManageAdminPageProps = {
  route: Route<typeof routes.manageConventionAdmin>;
};

export const ConventionManageAdminPage = ({
  route,
}: ConventionManageAdminPageProps) => {
  const conventionId = route.params.conventionId;
  const backOfficeJwt = useAdminToken();

  // ... Récupérer le JWT convention ou bien { convention, fetchConventionError, submitFeedback, isLoading } à partir d'un admin qui a le conventionId

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={8}>
        {backOfficeJwt ? (
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
        )}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
