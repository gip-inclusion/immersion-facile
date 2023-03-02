import React from "react";
import { MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { Route } from "type-route";
import { ConventionManageContent } from "../../components/admin/ConventionManageContent";

type ConventionManagePageProps = {
  route: Route<
    typeof routes.manageConvention | typeof routes.manageConventionOld
  >;
};

export const ConventionManagePage = ({ route }: ConventionManagePageProps) => {
  const jwt = route.params.jwt;
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={8}>
        <ConventionManageContent jwt={jwt} />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
