import React from "react";
import { MainWrapper, PageHeader } from "react-design-system";
import { EstablishmentForm } from "src/app/components/forms/establishment/EstablishmentForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";

export const EstablishmentFormPage = () => (
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
      <EstablishmentForm mode="create" />
    </MainWrapper>
  </HeaderFooterLayout>
);
