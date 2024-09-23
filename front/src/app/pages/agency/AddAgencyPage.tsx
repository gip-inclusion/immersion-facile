import React from "react";
import { MainWrapper, PageHeader } from "react-design-system";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import { AddAgencyForm } from "src/app/components/forms/agency/AddAgencyForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";

export const AddAgencyPage = () => (
  <HeaderFooterLayout>
    <MainWrapper
      layout="default"
      pageHeader={
        <PageHeader
          title="Ajout d'organisme encadrant les PMSMP"
          breadcrumbs={<Breadcrumbs />}
        />
      }
    >
      <AddAgencyForm />
    </MainWrapper>
  </HeaderFooterLayout>
);
