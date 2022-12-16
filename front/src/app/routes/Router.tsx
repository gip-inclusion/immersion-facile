import React from "react";
import { AdminPage } from "src/app/pages/admin/AdminPage";
import { AddAgencyPage } from "src/app/pages/agency/AddAgencyPage";
import { ConventionPageForUkraine } from "src/app/pages/convention/ConventionForUkrainePage";
import { ConventionImmersionPage } from "src/app/pages/convention/ConventionImmersionPage";
import { ConventionMiniStagePage } from "src/app/pages/convention/ConventionMiniStagePage";
import { ConventionSignPage } from "src/app/pages/convention/ConventionSignPage";
import { ConventionStatusDashboardPage } from "src/app/pages/convention/ConventionStatusDashboardPage";
import { ConventionValidatePage } from "src/app/pages/convention/ConventionValidatePage";
import { ErrorRedirectPage } from "src/app/pages/error/ErrorRedirectPage";
import { EstablishmentEditionFormPage } from "src/app/pages/establishment/EstablishmentEditionFormPage";
import { EstablishmentFormPageForExternals } from "src/app/pages/establishment/EstablishmentFormPageForExternals";
import { SearchPage } from "src/app/pages/search/SearchPage";
import { SearchListPage } from "src/app/pages/search/SearchListPage";

import { StatsPage } from "src/app/pages/StatsPage";
import { PrivateRoute } from "src/app/routes/PrivateRoute";
import { RenewExpiredLinkPage } from "src/app/routes/RenewExpiredLinkPage";
import { StandardLayout } from "../components/layout/StandardLayout";
import { ErrorPage } from "../pages/error/ErrorPage";
import { EstablishmentFormPage } from "../pages/establishment/EstablishmentFormPage";
import { HomePage } from "../pages/home/HomePage";
import { ImmersionAssessmentPage } from "../pages/immersion-assessment/ImmersionAssessmentPage";
import { StandardPageSlugs, standardPageSlugs } from "./route-params";
import { routes, useRoute } from "./routes";

export const Router = () => {
  const route = useRoute();

  return (
    <>
      {route.name === false && <ErrorPage type="httpClientNotFoundError" />}
      {route.name === "addAgency" && <AddAgencyPage />}
      {route.name === "adminTab" && (
        <PrivateRoute>
          <AdminPage route={route} />
        </PrivateRoute>
      )}
      {route.name === "adminRoot" &&
        routes.adminTab({ tab: "conventions" }).replace()}
      {route.name === "editFormEstablishment" && (
        <EstablishmentEditionFormPage route={route} />
      )}
      {route.name === "errorRedirect" && <ErrorRedirectPage route={route} />}
      {route.name === "formEstablishment" && (
        <EstablishmentFormPage route={route} />
      )}
      {route.name === "formEstablishmentForExternals" && (
        <EstablishmentFormPageForExternals route={route} />
      )}
      {route.name === "home" && <HomePage type="default" />}
      {route.name === "homeCandidates" && <HomePage type="candidate" />}
      {route.name === "homeEstablishments" && <HomePage type="establishment" />}
      {route.name === "homeAgencies" && <HomePage type="agency" />}

      {route.name === "conventionImmersion" && (
        <ConventionImmersionPage route={route} />
      )}
      {route.name === "conventionMiniStage" && (
        <ConventionMiniStagePage route={route} />
      )}
      {route.name === "conventionForUkraine" && (
        <ConventionPageForUkraine route={route} />
      )}
      {route.name === "conventionToValidate" && (
        <ConventionValidatePage route={route} />
      )}
      {route.name === "conventionToSign" && (
        <ConventionSignPage route={route} />
      )}
      {route.name === "conventionStatusDashboard" && (
        <ConventionStatusDashboardPage route={route} />
      )}
      {route.name === "immersionAssessment" && (
        <ImmersionAssessmentPage route={route} />
      )}
      {route.name === "renewConventionMagicLink" && (
        <RenewExpiredLinkPage route={route} />
      )}
      {route.name === "search" && <SearchPage route={route} />}
      {route.name === "searchV2" && <SearchListPage route={route} />}
      {route.name === "stats" && <StatsPage />}
      {route.name === "standard" &&
        standardPageSlugs.includes(
          route.params.pagePath as StandardPageSlugs,
        ) && <StandardLayout route={route} />}
      {route.name === "standard" &&
        !standardPageSlugs.includes(
          route.params.pagePath as StandardPageSlugs,
        ) && <ErrorPage type="httpClientNotFoundError" />}
    </>
  );
};
