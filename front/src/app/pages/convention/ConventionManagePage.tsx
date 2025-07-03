import { MainWrapper } from "react-design-system";
import {
  type ConventionJwtPayload,
  decodeMagicLinkJwtWithoutSignatureCheck,
} from "shared";
import type { JwtKindProps } from "src/app/components/admin/conventions/ConventionManageActions";
import { WithFeedbackReplacer } from "src/app/components/feedback/WithFeedbackReplacer";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAdminToken } from "src/app/hooks/jwt.hooks";
import type { routes } from "src/app/routes/routes";
import { match } from "ts-pattern";
import type { Route } from "type-route";
import { ConventionManageContent } from "../../components/admin/conventions/ConventionManageContent";

type ConventionManagePageProps = {
  route:
    | Route<typeof routes.manageConvention>
    | Route<typeof routes.adminConventionDetail>;
};

export const ConventionManagePage = ({ route }: ConventionManagePageProps) => {
  const adminToken = useAdminToken();
  const jwtParams: JwtKindProps | undefined = match(route)
    .with(
      {
        name: "adminConventionDetail",
      },
      () =>
        (adminToken
          ? { jwt: adminToken, kind: "connected user backoffice" }
          : undefined) satisfies JwtKindProps | undefined,
    )
    .with(
      {
        name: "manageConvention",
      },
      (route) =>
        ({ jwt: route.params.jwt, kind: "convention" }) satisfies JwtKindProps,
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
        <WithFeedbackReplacer topic="transfer-convention-to-agency">
          <ConventionManageContent
            jwtParams={jwtParams}
            conventionId={conventionId}
          />
        </WithFeedbackReplacer>
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
