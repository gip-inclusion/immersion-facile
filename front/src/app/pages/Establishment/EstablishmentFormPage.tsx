import React from "react";
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
    <EstablishmentCreationForm
      source="immersion-facile"
      siret={route.params.siret}
    />
  </HeaderFooterLayout>
);
