import React from "react";
import { Route } from "type-route";
import { MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAdminToken } from "src/app/hooks/useAdminToken";
import { routes } from "src/app/routes/routes";

type EstablishmentManageAdminPageProps = {
  route: Route<typeof routes.manageEstablishmentAdmin>;
};

export const EstablishmentManageAdminPage = ({
  route,
}: EstablishmentManageAdminPageProps) => {
  const siret = route.params.siret;
  const backOfficeJwt = useAdminToken();

  // ... Récupérer le JWT convention ou bien { convention, fetchConventionError, submitFeedback, isLoading } à partir d'un admin qui a le conventionId

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={8}>
        {backOfficeJwt && (
          <>
            {" "}
            WELCOME TO ESTABLISMENT MANAGE PAGE FOR SIRET {siret} with jwt{" "}
            {backOfficeJwt}
          </>
        )}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
