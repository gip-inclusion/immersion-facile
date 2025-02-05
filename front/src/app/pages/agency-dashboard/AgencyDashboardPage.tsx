import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { subMinutes } from "date-fns";
import React from "react";
import { Loader } from "react-design-system";
import { distinguishAgencyRights } from "shared";
import { NoActiveAgencyRights } from "src/app/components/agency/agency-dashboard/NoActiveAgencyRights";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { FrontAgencyDashboardRoute } from "src/app/routes/InclusionConnectedPrivateRoute";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { P, match } from "ts-pattern";
import { AgencyDashboard } from "../../components/agency/agency-dashboard/AgencyDashboard";
import { RegisterAgenciesForm } from "../../components/forms/register-agencies/RegisterAgenciesForm";

export const AgencyDashboardPage = ({
  route,
}: {
  route: FrontAgencyDashboardRoute;
}) => {
  // the Layout (Header, Footer...) is given by InclusionConnectedPrivateRoute (higher order component)
  const currentUser = useAppSelector(inclusionConnectedSelectors.currentUser);
  const isLoading = useAppSelector(inclusionConnectedSelectors.isLoading);
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );

  return (
    <>
      {isLoading && <Loader />}
      <Feedback topic="dashboard-agency-register-user" />

      {match({ currentUser })
        .with(
          {
            currentUser: {
              agencyRights: [],
            },
          },
          ({ currentUser }) => {
            if (new Date(currentUser.createdAt) > subMinutes(new Date(), 1))
              return (
                <>
                  <h1>Demander l'accès à des organismes</h1>
                  <Alert
                    severity="warning"
                    title="Rattachement à vos organismes en cours"
                    description="Vous êtes bien connecté. Nous sommes en train de vérifier si vous avez des organismes rattachées à votre compte. Merci de patienter. Ca ne devrait pas prendre plus de 1 minute. Veuillez recharger la page après ce delai."
                  />
                </>
              );
            return (
              <>
                <h1>Demander l'accès à des organismes</h1>
                <p className={fr.cx("fr-mt-4w")}>
                  Bonjour {currentUser.firstName} {currentUser.lastName},
                  recherchez un organisme afin d'accéder aux conventions et
                  statistiques de ce dernier. Un administrateur vérifiera et
                  validera votre demande.
                </p>
                <RegisterAgenciesForm currentUser={currentUser} />
              </>
            );
          },
        )
        .with(
          {
            currentUser: P.not(null),
          },
          ({ currentUser }) => {
            const { activeAgencyRights, toReviewAgencyRights } =
              distinguishAgencyRights(currentUser.agencyRights);

            return activeAgencyRights.length ? (
              <>
                <h1>Bienvenue</h1>
                <AgencyDashboard
                  route={route}
                  activeAgencyRights={activeAgencyRights}
                  dashboards={currentUser.dashboards}
                  inclusionConnectedJwt={inclusionConnectedJwt}
                />
              </>
            ) : (
              <NoActiveAgencyRights
                toReviewAgencyRights={toReviewAgencyRights}
                currentUser={currentUser}
              />
            );
          },
        )
        .otherwise(() => null)}
    </>
  );
};
