import { MainWrapper, PageHeader } from "react-design-system";
import { Breadcrumbs } from "src/app/components/Breadcrumbs";
import { EstablishmentForm } from "src/app/components/forms/establishment/EstablishmentForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";

export const EstablishmentCreationFormPage = () => (
  <HeaderFooterLayout>
    <MainWrapper
      layout="default"
      pageHeader={
        <PageHeader
          title="Proposer une immersion"
          breadcrumbs={<Breadcrumbs />}
        />
      }
    >
      <EstablishmentForm mode="create" />
    </MainWrapper>
  </HeaderFooterLayout>
);
