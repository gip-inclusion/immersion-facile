import { fr } from "@codegouvfr/react-dsfr";
import Alert from "@codegouvfr/react-dsfr/Alert";
import { type ReactNode, useEffect } from "react";
import { Loader } from "react-design-system";
import { useDispatch } from "react-redux";
import { EstablishmentDashboardTabs } from "src/app/components/establishment/establishment-dashboard/EstablishmentDashboardTabs";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import type { FrontEstablishmentDashboardRoute } from "src/app/pages/auth/ConnectedPrivateRoute";
import { authSelectors } from "src/core-logic/domain/auth/auth.selectors";
import { connectedUserSelectors } from "src/core-logic/domain/connected-user/connectedUser.selectors";
import { establishmentSelectors } from "src/core-logic/domain/establishment/establishment.selectors";
import { establishmentSlice } from "src/core-logic/domain/establishment/establishment.slice";
import { EstablishmentDashboardAccessNotAllowedContent } from "../../components/establishment/establishment-dashboard/EstablishmentDashboardAccessNotAllowedContent";

export const EstablishmentDashboardPage = ({
  route,
}: {
  route: FrontEstablishmentDashboardRoute;
}): ReactNode => {
  const dispatch = useDispatch();
  const connectedUserJwt = useAppSelector(authSelectors.connectedUserJwt);
  const currentUser = useAppSelector(connectedUserSelectors.currentUser);
  const isLoadingUser = useAppSelector(connectedUserSelectors.isLoading);
  const isLoadingEstablishment = useAppSelector(
    establishmentSelectors.isLoading,
  );
  const establishmentNameAndAdmins = useAppSelector(
    establishmentSelectors.establishmentNameAndAdmins,
  );
  const proConnectSiret = currentUser?.proConnect?.siret;
  const isEstablishmentNameAndAdminsRequired =
    proConnectSiret &&
    !currentUser.establishments?.some(
      (establishment) => establishment.siret === proConnectSiret,
    ) &&
    !currentUser.dashboards.establishments.conventions;
  const isDashboardAccessNotAllowed =
    isEstablishmentNameAndAdminsRequired &&
    establishmentNameAndAdmins !== null &&
    establishmentNameAndAdmins !== "establishmentNotFound";

  useEffect(() => {
    if (isEstablishmentNameAndAdminsRequired && connectedUserJwt) {
      dispatch(
        establishmentSlice.actions.fetchEstablishmentNameAndAdminsRequested({
          siret: proConnectSiret,
          jwt: connectedUserJwt,
          feedbackTopic: "form-establishment",
        }),
      );
    }
  }, [
    proConnectSiret,
    isEstablishmentNameAndAdminsRequired,
    connectedUserJwt,
    dispatch,
  ]);
  const isUserConnected = currentUser && connectedUserJwt;
  return (
    <>
      <div className={fr.cx("fr-grid-row")}>
        <h1>Mon espace établissement</h1>
      </div>
      {isLoadingUser || (isLoadingEstablishment && <Loader />)}
      {isUserConnected &&
        (isDashboardAccessNotAllowed ? (
          <EstablishmentDashboardAccessNotAllowedContent
            establishmentNameAndAdmins={establishmentNameAndAdmins}
            siret={proConnectSiret}
          />
        ) : (
          <EstablishmentDashboardTabs currentUser={currentUser} route={route} />
        ))}
      {!isUserConnected && (
        <Alert
          severity="error"
          title="Vous n'êtes pas connecté avec ProConnect."
        />
      )}
    </>
  );
};
