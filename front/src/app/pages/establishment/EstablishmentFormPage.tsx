import React from "react";
import { Route } from "type-route";

import { MainWrapper, PageHeader } from "react-design-system";

import { EstablishmentCreationForm } from "src/app/components/forms/establishment/EstablishmentCreationForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";

export const EstablishmentFormPage = ({
  route,
}: {
  route: Route<typeof routes.formEstablishment>;
}) => (
  <HeaderFooterLayout>
    <MainWrapper
      layout="boxed"
      pageHeader={
        <PageHeader
          title="Référencer mon entreprise"
          centered
          theme="establishment"
        />
      }
    >
      <EstablishmentCreationForm
        source="immersion-facile"
        siret={route.params.siret}
      />
    </MainWrapper>
  </HeaderFooterLayout>
);
