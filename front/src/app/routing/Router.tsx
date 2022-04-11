import React from "react";
import { AddAgencyPage } from "src/app/pages/Agency/AddAgencyPage";
import { AdminPage } from "src/app/pages/admin/AdminPage";
import { ImmersionApplicationPage } from "src/app/pages/ImmersionApplication/ImmersionApplicationPage";
import { ImmersionApplicationPageForExternals } from "src/app/pages/ImmersionApplication/ImmersionApplicationPageForExternals";
import { useFeatureFlagsContext } from "src/app/utils/FeatureFlagContext";
import { EstablishmentEditionFormPage } from "../pages/Establishment/EstablishmentEditionFormPage";
import { HomePage } from "src/app/pages/Static/HomePage";
import { LandingEstablishmentPage } from "src/app/pages/Static/LandingEstablishmentPage";
import { useRoute } from "./routes";
import { ImmersionApplicationValidatePage } from "src/app/pages/ImmersionApplication/ImmersionApplicationValidatePage";
import { ENV } from "src/environmentVariables";
import { RenewExpiredLinkPage } from "../../helpers/RenewExpiredLinkPage";
import { AdminVerificationPage } from "../pages/admin/AdminVerificationPage";
import { ImmersionApplicationSignPage } from "src/app/pages/ImmersionApplication/ImmersionApplicationSignPage";
import { SearchDebugPage } from "../components/SearchDebugPage";
import { SearchPage } from "src/app/pages/Search/SearchPage";
import { EstablishmentFormImmersionFacilePage } from "../pages/Establishment/EstablishmentFormImmersionFacilePage";
import { EstablishmentFormPageForExternals } from "../pages/Establishment/EstablishmentFormPageForExternals";

const { envType } = ENV;

const NotAvailable = () => <div>Cette page n'est pas disponible.</div>;

export const Router = () => {
  const route = useRoute();
  const featureFlags = useFeatureFlagsContext();

  return (
    <>
      {route.name === false && <NotAvailable />}
      {route.name === "addAgency" && <AddAgencyPage />}
      {route.name === "admin" && <AdminPage route={route} />}
      {route.name === "adminVerification" &&
        (featureFlags.enableAdminUi ? (
          <AdminVerificationPage route={route} />
        ) : (
          <NotAvailable />
        ))}
      {route.name === "agencyAdmin" &&
        (featureFlags.enableAdminUi ? (
          <AdminPage route={route} />
        ) : (
          <NotAvailable />
        ))}
      {route.name === "editFormEstablishment" && (
        <EstablishmentEditionFormPage route={route} />
      )}
      {route.name === "formEstablishment" && (
        <EstablishmentFormImmersionFacilePage />
      )}
      {route.name === "formEstablishmentForExternals" && (
        <EstablishmentFormPageForExternals route={route} />
      )}
      {route.name === "home" && <HomePage showDebugInfo={envType === "DEV"} />}

      {route.name === "landingEstablishment" && <LandingEstablishmentPage />}
      {route.name === "immersionApplication" && (
        <ImmersionApplicationPage route={route} />
      )}
      {route.name === "immersionApplicationForExternals" && (
        <ImmersionApplicationPageForExternals route={route} />
      )}
      {route.name === "immersionApplicationsToValidate" && (
        <ImmersionApplicationValidatePage route={route} />
      )}
      {route.name === "immersionApplicationsToSign" && (
        <ImmersionApplicationSignPage route={route} />
      )}
      {route.name === "renewMagicLink" && (
        <RenewExpiredLinkPage route={route} />
      )}
      {route.name === "search" && <SearchPage />}
      {envType === "DEV" && route.name === "searchDebug" && <SearchDebugPage />}
    </>
  );
};
