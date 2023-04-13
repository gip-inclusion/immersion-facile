import React from "react";
import { Route } from "type-route";

import { MainWrapper } from "react-design-system";

import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAdminToken } from "src/app/hooks/useAdminToken";
import { routes } from "src/app/routes/routes";

import { ConventionManageContent } from "../../components/admin/ConventionManageContent";

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
        {backOfficeJwt && (
          <ConventionManageContent
            jwt={backOfficeJwt}
            conventionId={conventionId}
            role={"backOffice"}
          />
        )}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
