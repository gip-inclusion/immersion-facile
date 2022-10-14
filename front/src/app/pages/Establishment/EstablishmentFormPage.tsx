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
    <MainWrapper className="fr-container fr-grid--center">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-lg-7 fr-px-2w">
          <EstablishmentCreationForm
            source="immersion-facile"
            siret={route.params.siret}
          />
        </div>
      </div>
    </MainWrapper>
  </HeaderFooterLayout>
);
