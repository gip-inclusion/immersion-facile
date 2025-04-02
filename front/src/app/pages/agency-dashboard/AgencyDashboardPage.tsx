import { fr } from "@codegouvfr/react-dsfr";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { subMinutes } from "date-fns";
import { useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { distinguishAgencyRights } from "shared";
import { NoActiveAgencyRights } from "src/app/components/agency/agency-dashboard/NoActiveAgencyRights";
import { Feedback } from "src/app/components/feedback/Feedback";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { FrontAgencyDashboardRoute } from "src/app/routes/InclusionConnectedPrivateRoute";
import { agenciesSlice } from "src/core-logic/domain/agencies/agencies.slice";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import type { FeedbackTopic } from "src/core-logic/domain/feedback/feedback.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { P, match } from "ts-pattern";
import { AgencyDashboard } from "../../components/agency/agency-dashboard/AgencyDashboard";
import { RegisterAgenciesForm } from "../../components/forms/register-agencies/RegisterAgenciesForm";

export const AgencyDashboardPage = ({
  route,
}: {
  route: FrontAgencyDashboardRoute;
}) => {
  const dispatch = useDispatch();
  const currentUser = useAppSelector(inclusionConnectedSelectors.currentUser);
  const isLoading = useAppSelector(inclusionConnectedSelectors.isLoading);
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );
  const federatedIdentity = useAppSelector(authSelectors.federatedIdentity);

  const feedbackTopic: FeedbackTopic = "dashboard-agency-register-user";

  useEffect(() => {
    if (federatedIdentity && federatedIdentity.provider === "connectedUser")
      dispatch(
        agenciesSlice.actions.fetchAgencyOptionsRequested({
          siret: federatedIdentity.siret,
          status: ["active", "from-api-PE"],
        }),
      );
  }, [dispatch, federatedIdentity]);

  return (
    <>
      <h1>Mon espace prescripteur</h1>
      {isLoading && <Loader />}
      <Feedback topics={[feedbackTopic]} />

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
                <Alert
                  severity="warning"
                  title="Rattachement à vos organismes en cours"
                  description="Vous êtes bien connecté. Nous sommes en train de vérifier si vous avez des organismes rattachées à votre compte. Merci de patienter. Ca ne devrait pas prendre plus de 1 minute. Veuillez recharger la page après ce delai."
                />
              );
            return (
              <>
                {federatedIdentity &&
                federatedIdentity.provider === "connectedUser" ? (
                  <strong className={fr.cx("fr-mt-4w", "fr-text--lead")}>
                    Bonjour {currentUser.firstName} {currentUser.lastName}, vous
                    avez sélectionné le SIRET {federatedIdentity.siret} lors de
                    la création de votre compte sur ProConnect
                  </strong>
                ) : (
                  <p>
                    Bonjour {currentUser.firstName} {currentUser.lastName},
                    recherchez un organisme afin d'accéder aux conventions et
                    statistiques de ce dernier. Un administrateur vérifiera et
                    validera votre demande.
                  </p>
                )}

                <RegisterAgenciesForm
                  currentUser={currentUser}
                  {...(federatedIdentity &&
                  federatedIdentity.provider === "connectedUser"
                    ? { initialSiret: federatedIdentity.siret }
                    : {})}
                />
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
              <AgencyDashboard
                route={route}
                activeAgencyRights={activeAgencyRights}
                dashboards={currentUser.dashboards}
                inclusionConnectedJwt={inclusionConnectedJwt}
              />
            ) : (
              <NoActiveAgencyRights
                toReviewAgencyRights={toReviewAgencyRights}
                currentUser={currentUser}
                feedbackTopic={feedbackTopic}
              />
            );
          },
        )
        .otherwise(() => null)}
    </>
  );
};
