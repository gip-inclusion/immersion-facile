import React from "react";
import { MainWrapper, PageHeader } from "react-design-system";
import { EstablishmentForm } from "src/app/components/forms/establishment/EstablishmentForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";

export const EstablishmentEditionFormPage = () => (
  <HeaderFooterLayout>
    <MainWrapper
      layout="boxed"
      pageHeader={
        <PageHeader
          title="Éditer une entreprise référencée"
          centered
          theme="establishment"
        />
      }
    >
      <EstablishmentForm mode="edit" />
    </MainWrapper>
  </HeaderFooterLayout>
);
