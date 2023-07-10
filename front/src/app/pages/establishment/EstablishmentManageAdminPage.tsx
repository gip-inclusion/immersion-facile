import React from "react";
import { MainWrapper } from "react-design-system";
import { EstablishmentForm } from "src/app/components/forms/establishment/EstablishmentForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";

export const EstablishmentManageAdminPage = () => (
  <HeaderFooterLayout>
    <MainWrapper layout="default" vSpacing={8}>
      <EstablishmentForm mode="admin" />
    </MainWrapper>
  </HeaderFooterLayout>
);
