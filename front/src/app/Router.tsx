import React from "react";
import { AddAgencyForm } from "src/app/AddAgency/AddAgencyForm";
import { Admin } from "src/app/admin/Admin";
import { ApplicationForm } from "src/app/ApplicationForm/ApplicationForm";
import { useFeatureFlagsContext } from "src/app/FeatureFlagContext";
import { Home } from "src/app/Home";
import { LandingEstablishment } from "src/app/LandingEstablishment/LandingEstablishment";
import { useRoute } from "src/app/routes";
import { VerificationPage } from "src/app/Verification/VerificationPage";
import { Layout } from "src/components/Layout";
import { ENV } from "src/environmentVariables";
import { RenewExpiredLink } from "../helpers/RenewExpiredLink";
import { AdminVerification } from "./admin/AdminVerification";
import { SignForm } from "./ApplicationForm/SignForm";
import { SearchDebug } from "./Debug/SearchDebug";
import { Search } from "./Search/Search";
import { EstablishmentFormImmersionFacile } from "./FormEstablishment/EstablishmentFormImmersionFacile";
import { EstablishmentFormForExternals } from "./FormEstablishment/EstablishmentFormForExternals";

const { dev } = ENV;

const NotAvailable = () => <div>Cette page n'est pas disponible.</div>;

export const Router = () => {
  const route = useRoute();
  const featureFlags = useFeatureFlagsContext();

  return (
    <>
      {route.name === "home" && <Home showDebugInfo={dev} />}
      {route.name === "landingEstablishment" && <LandingEstablishment />}
      {route.name === "formEstablishment" && (
        <EstablishmentFormImmersionFacile />
      )}
      {route.name === "formEstablishmentForExternals" && (
        <EstablishmentFormForExternals route={route} />
      )}
      {route.name === "immersionApplicationsToValidate" && (
        <VerificationPage route={route} />
      )}
      {route.name === "immersionApplicationsToSign" && (
        <SignForm route={route} />
      )}
      {route.name === "immersionApplication" && (
        <ApplicationForm route={route} />
      )}
      {route.name === "admin" && <Admin route={route} />}
      {route.name === "adminVerification" &&
        (featureFlags.enableAdminUi ? (
          <AdminVerification route={route} />
        ) : (
          <NotAvailable />
        ))}
      {route.name === "agencyAdmin" &&
        (featureFlags.enableAdminUi ? (
          <Admin route={route} />
        ) : (
          <NotAvailable />
        ))}
      {route.name === "renewMagicLink" && <RenewExpiredLink route={route} />}
      {dev && route.name === "searchDebug" && <SearchDebug />}
      {route.name === "search" && <Search />}
      {route.name === "addAgency" && <AddAgencyForm />}
      {route.name === false && <NotAvailable />}
    </>
  );
};
