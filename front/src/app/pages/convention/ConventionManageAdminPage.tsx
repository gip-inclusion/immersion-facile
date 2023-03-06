import React from "react";
import { MainWrapper } from "react-design-system";
import { Role } from "shared";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";
import { ConventionManageContent } from "../../components/admin/ConventionManageContent";

type ConventionManageAdminPageProps = {
  route: Route<typeof routes.manageConventionAdmin>;
};

export const ConventionManageAdminPage = ({
  route,
}: ConventionManageAdminPageProps) => {
  const _conventionId = route.params.conventionId;
  const _role: Role = "admin";

  // ... Récupérer le JWT convention ou bien { convention, fetchConventionError, submitFeedback, isLoading } à partir d'un admin qui a le conventionId

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={8}>
        <ConventionManageContent jwt={"0000000000000000000000000"} />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
