import React from "react";
import { match } from "ts-pattern";
import { Route } from "type-route";
import {
  ConventionJwtPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
} from "shared";
import { MainWrapper } from "react-design-system";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAdminToken } from "src/app/hooks/jwt.hooks";
import { routes } from "src/app/routes/routes";
import { ConventionManageContent } from "../../components/admin/conventions/ConventionManageContent";

type ConventionManagePageProps = {
  route:
    | Route<typeof routes.manageConvention>
    | Route<typeof routes.manageConventionAdmin>;
};

export const ConventionManagePage = ({ route }: ConventionManagePageProps) => {
  const adminToken = useAdminToken();
  const jwt = match(route)
    .with(
      {
        name: "manageConventionAdmin",
      },
      () => adminToken,
    )
    .with(
      {
        name: "manageConvention",
      },
      (route) => route.params.jwt,
    )
    .exhaustive();

  if (!jwt) return null;

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
