import { Alert } from "@codegouvfr/react-dsfr/Alert";

import { MainWrapper } from "react-design-system";
import { ConventionManageContent } from "src/app/components/admin/conventions/ConventionManageContent";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import type { Route } from "type-route";

type ConventionManageAdminPageProps = {
  route: Route<typeof routes.manageConventionInclusionConnected>;
};

export const ConventionManageInclusionConnectedPage = ({
  route,
}: ConventionManageAdminPageProps) => {
  const conventionId = route.params.conventionId;
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );

  return (
    <HeaderFooterLayout>
      <MainWrapper layout="default" vSpacing={8}>
        {inclusionConnectedJwt ? (
          <ConventionManageContent
            jwtParams={{ jwt: inclusionConnectedJwt, kind: "inclusionConnect" }}
            conventionId={conventionId}
          />
        ) : (
          <Alert
            severity="error"
            title="Non autorisé"
            description="Cette page est reservé aux utilisteurs connecté avec Inclusion Connect, et dont l'agence est responsable de cette convention."
          />
        )}
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
