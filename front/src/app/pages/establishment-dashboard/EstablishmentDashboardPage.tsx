import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { type ReactNode, useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { EstablishmentDashboardTabs } from "src/app/components/establishment/establishment-dashboard/EstablishmentDashboardTabs";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { FrontEstablishmentDashboardRoute } from "src/app/routes/ConnectedPrivateRoute";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { establishmentSelectors } from "src/core-logic/domain/establishment/establishment.selectors";
import { establishmentSlice } from "src/core-logic/domain/establishment/establishment.slice";
import { inclusionConnectedSelectors } from "src/core-logic/domain/inclusionConnected/inclusionConnected.selectors";
import { P, match } from "ts-pattern";
import { EstablishmentDashboardAccessNotAllowedContent } from "../../components/establishment/establishment-dashboard/EstablishmentDashboardAccessNotAllowedContent";

export const EstablishmentDashboardPage = ({
  route,
}: {
  route: FrontEstablishmentDashboardRoute;
}): ReactNode => {
  const dispatch = useDispatch();
  const inclusionConnectedJwt = useAppSelector(
    authSelectors.inclusionConnectToken,
  );
  const currentUser = useAppSelector(inclusionConnectedSelectors.currentUser);
  const isLoadingUser = useAppSelector(inclusionConnectedSelectors.isLoading);

  return (
    <>
      <div className={fr.cx("fr-grid-row")}>
        <h1>Mon espace établissement</h1>
      </div>
      {isLoadingUser && <Loader />}
      {match({ currentUser, inclusionConnectedJwt })
        .with(
          {
            currentUser: P.not(P.nullish),
            inclusionConnectedJwt: P.not(P.nullish),
          },
          ({ currentUser, inclusionConnectedJwt }) => {
            const isLoadingEstablishment = useAppSelector(
              establishmentSelectors.isLoading,
            );
            const establishmentNameAndAdmins = useAppSelector(
              establishmentSelectors.establishmentNameAndAdmins,
            );

            const proConnectSiret = currentUser.proConnect?.siret;

            const isEstablishmentNameAndAdminsRequired =
              proConnectSiret &&
              !currentUser.establishments?.some(
                (establishment) => establishment.siret === proConnectSiret,
              ) &&
              !currentUser.dashboards.establishments.conventions;

            useEffect(() => {
              if (isEstablishmentNameAndAdminsRequired) {
                dispatch(
                  establishmentSlice.actions.fetchEstablishmentNameAndAdminsRequested(
                    {
                      siret: proConnectSiret,
                      jwt: inclusionConnectedJwt,
                      feedbackTopic: "form-establishment",
                    },
                  ),
                );
              }
            }, [
              proConnectSiret,
              isEstablishmentNameAndAdminsRequired,
              inclusionConnectedJwt,
            ]);

            const isDashboardAccessNotAllowed =
              isEstablishmentNameAndAdminsRequired &&
              establishmentNameAndAdmins !== null &&
              establishmentNameAndAdmins !== "establishmentNotFound";

            return (
              <>
                {isLoadingEstablishment && <Loader />}
                {isDashboardAccessNotAllowed ? (
                  <EstablishmentDashboardAccessNotAllowedContent
                    establishmentNameAndAdmins={establishmentNameAndAdmins}
                    siret={proConnectSiret}
                  />
                ) : (
                  <EstablishmentDashboardTabs
                    currentUser={currentUser}
                    route={route}
                  />
                )}
              </>
            );
          },
        )
        .otherwise(() => (
          <Alert
            severity="error"
            title="Vous n'êtes pas connecté avec ProConnect."
          />
        ))}
    </>
  );
};
