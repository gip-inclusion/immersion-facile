import { Alert } from "@codegouvfr/react-dsfr/Alert";

import { ConventionManageContent } from "src/app/components/admin/conventions/ConventionManageContent";
import { WithFeedbackReplacer } from "src/app/components/feedback/WithFeedbackReplacer";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { routes } from "src/app/routes/routes";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import type { Route } from "type-route";

type ConventionManageConnectedUserPageProps = {
  route: Route<typeof routes.manageConventionConnectedUser>;
};

export const ConventionManageConnectedUserPage = ({
  route,
}: ConventionManageConnectedUserPageProps) => {
  const conventionId = route.params.conventionId;
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);

  return (
    <>
      {connectedUserJwt ? (
        <WithFeedbackReplacer topic="transfer-convention-to-agency">
          <ConventionManageContent
            jwtParams={{
              jwt: connectedUserJwt,
              kind: "connected user",
            }}
            conventionId={conventionId}
          />
        </WithFeedbackReplacer>
      ) : (
        <Alert
          severity="error"
          title="Non autorisé"
          description="Cette page est reservée aux utilisteurs connectés avec ProConnect, et dont l'agence est responsable de cette convention."
        />
      )}
    </>
  );
};
