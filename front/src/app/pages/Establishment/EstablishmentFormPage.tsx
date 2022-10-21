import React from "react";
import { MainWrapper } from "react-design-system/immersionFacile";
import { HeaderFooterLayout } from "src/app/layouts/HeaderFooterLayout";
import { routes } from "src/app/routing/routes";
import { Route } from "type-route";
import { EstablishmentCreationForm } from "./components/EstablishmentCreationForm";

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
