import React from "react";
import { Route } from "type-route";

import {
  ConventionMagicLinkPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
} from "shared";

import { MainWrapper } from "react-design-system";

import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";

import { ConventionManageContent } from "../../components/admin/ConventionManageContent";

type ConventionManagePageProps = {
  route: Route<
    typeof routes.manageConvention | typeof routes.manageConventionOld
  >;
};

export const ConventionManagePage = ({ route }: ConventionManagePageProps) => {
  const jwt = route.params.jwt;
  const { role, applicationId: conventionId } =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionMagicLinkPayload>(jwt);
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={8}>
        <ConventionManageContent
          jwt={jwt}
          conventionId={conventionId}
          role={role}
        />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
