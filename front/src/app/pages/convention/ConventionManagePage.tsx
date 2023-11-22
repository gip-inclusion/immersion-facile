import React from "react";
import { match } from "ts-pattern";
import { Route } from "type-route";
import {
  ConventionJwtPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
} from "shared";
import { MainWrapper } from "react-design-system";
import { JwtKindProps } from "src/app/components/admin/conventions/ConventionManageActions";
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
  const jwtParams: JwtKindProps | undefined = match(route)
    .with(
      {
        name: "manageConventionAdmin",
      },
      () =>
        (adminToken
          ? { jwt: adminToken, kind: "backoffice" }
          : undefined) satisfies JwtKindProps | undefined,
    )
    .with(
      {
        name: "manageConvention",
      },
      (route) =>
        ({ jwt: route.params.jwt, kind: "convention" } satisfies JwtKindProps),
    )
    .exhaustive();

  if (!jwtParams) return null;

  const { applicationId: conventionId } =
    decodeMagicLinkJwtWithoutSignatureCheck<ConventionJwtPayload>(
      jwtParams.jwt,
    );

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={8}>
        <ConventionManageContent
          jwtParams={jwtParams}
          conventionId={conventionId}
        />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
