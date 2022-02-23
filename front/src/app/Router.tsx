import React from "react";
import { Admin } from "src/app/admin/Admin";
import { useFeatureFlagsContext } from "src/app/FeatureFlagContext";
import { LandingEstablishment } from "src/app/LandingEstablishment/LandingEstablishment";
import { VerificationPage } from "src/app/Verification/VerificationPage";
import { ApplicationForm } from "src/app/ApplicationForm/ApplicationForm";
import { Home } from "src/app/Home";
import { useRoute } from "src/app/routes";
import { ENV } from "src/environmentVariables";
import { AdminVerification } from "./admin/AdminVerification";
import { EstablishmentForm } from "./FormEstablishment/EstablishmentForm";
import { PopulateDB } from "./Debug/PopulateDB";
import { SearchDebug } from "./Debug/SearchDebug";
import { RenewExpiredLink } from "../helpers/RenewExpiredLink";
import { Search } from "./Search/Search";
import { SignForm } from "./ApplicationForm/SignForm";

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
        <EstablishmentForm route={route} />
      )}
      {route.name === "formEstablishmentForIframes" && (
        <EstablishmentForm route={route} />
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
      {dev && route.name === "debugPopulateDB" && <PopulateDB route={route} />}
      {dev && route.name === "searchDebug" && <SearchDebug />}
      {route.name === "search" && <Search />}
      {route.name === false && <NotAvailable />}
    </>
  );
};
