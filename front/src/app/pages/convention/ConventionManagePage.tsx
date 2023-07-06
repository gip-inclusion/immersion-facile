import React from "react";
import { Route } from "type-route";
import {
  ConventionJwtPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
} from "shared";
import { MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { ConventionManageContent } from "../../components/admin/conventions/ConventionManageContent";

type ConventionManagePageProps = {
  route: Route<typeof routes.manageConvention>;
};

export const ConventionManagePage = ({ route }: ConventionManagePageProps) => {
  const jwt = route.params.jwt;
  const { applicationId: conventionId } =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(jwt);

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={8}>
        <ConventionManageContent jwt={jwt} conventionId={conventionId} />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
