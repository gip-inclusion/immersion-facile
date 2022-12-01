import React from "react";
import { MainWrapper } from "react-design-system/immersionFacile";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";
import { EstablishmentCreationForm } from "src/app/components/forms/establishment/EstablishmentCreationForm";

export const EstablishmentFormPage = ({
  route,
}: {
  route: Route<typeof routes.formEstablishment>;
}) => (
  <HeaderFooterLayout>
    <MainWrapper layout="boxed">
      <EstablishmentCreationForm
        source="immersion-facile"
        siret={route.params.siret}
      />
    </MainWrapper>
  </HeaderFooterLayout>
);
