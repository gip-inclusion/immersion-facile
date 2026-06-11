import { Alert } from "@codegouvfr/react-dsfr/Alert";
import type { frontRoutes } from "shared";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import type { Route } from "type-route";
import { ConventionManageContent } from "../../components/admin/conventions/ConventionManageContent";

type ConventionManageAdminPageProps = {
  route: Route<typeof frontRoutes.adminConventionDetail>;
};

export const AdminConventionDetail = ({
  route,
}: ConventionManageAdminPageProps) => {
  const conventionId = route.params.conventionId;
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const isBackOfficeAdmin = useAppSelector(authSelectors.isAdminConnected);

  return connectedUserJwt && isBackOfficeAdmin ? (
    <ConventionManageContent
      jwtParams={{ jwt: connectedUserJwt, kind: "connected user backoffice" }}
      conventionId={conventionId}
    />
  ) : (
    <Alert
      severity="error"
      title="Non autorisé"
      description="Cette page est reservée aux administrateurs d'Immersion Facilitée."
    />
  );
};
