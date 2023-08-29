import React from "react";
import { Loader, MainWrapper } from "react-design-system";
import { EstablishmentForm } from "src/app/components/forms/establishment/EstablishmentForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAdminToken } from "src/app/hooks/useAdminToken";

export const ManageEstablishmentAdminPage = () => {
  const adminToken = useAdminToken();
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={8}>
        {adminToken ? <EstablishmentForm mode="admin" /> : <Loader />}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
