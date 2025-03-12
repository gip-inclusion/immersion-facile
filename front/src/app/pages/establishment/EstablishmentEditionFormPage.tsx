import { MainWrapper, PageHeader } from "react-design-system";
import { EstablishmentForm } from "src/app/components/forms/establishment/EstablishmentForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";

export const EstablishmentEditionFormPage = () => (
  <HeaderFooterLayout>
    <MainWrapper
      layout="default"
      pageHeader={<PageHeader title="Éditer une entreprise référencée" />}
    >
      <EstablishmentForm mode="edit" />
    </MainWrapper>
  </HeaderFooterLayout>
);
