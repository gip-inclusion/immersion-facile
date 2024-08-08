import React from "react";
import { MainWrapper, PageHeader } from "react-design-system";
import { EstablishmentForm } from "src/app/components/forms/establishment/EstablishmentForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";

export const EstablishmentCreationFormPage = () => (
  <HeaderFooterLayout>
    <MainWrapper
      layout="default"
      pageHeader={<PageHeader title="Proposer une immersion" />}
    >
      <EstablishmentForm mode="create" />
    </MainWrapper>
  </HeaderFooterLayout>
);
