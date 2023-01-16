import React from "react";
import { AdminPage } from "src/app/pages/admin/AdminPage";
import { AddAgencyPage } from "src/app/pages/agency/AddAgencyPage";
import { AgencyDashboardPage } from "src/app/pages/AgencyDashboardPage";
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
import { StatsPage } from "src/app/pages/StatsPage";
import { AdminPrivateRoute } from "src/app/routes/AdminPrivateRoute";
import { InclusionConnectedPrivateRoute } from "src/app/routes/InclusionConnectedPrivateRoute";
import { RenewExpiredLinkPage } from "src/app/routes/RenewExpiredLinkPage";
import { Route } from "type-route";
import { StandardLayout } from "../components/layout/StandardLayout";
import { ErrorPage } from "../pages/error/ErrorPage";
import { EstablishmentFormPage } from "../pages/establishment/EstablishmentFormPage";
import { HomePage } from "../pages/home/HomePage";
import { ImmersionAssessmentPage } from "../pages/immersion-assessment/ImmersionAssessmentPage";
import { StandardPageSlugs, standardPageSlugs } from "./route-params";
import { routes, useRoute } from "./routes";
import { ConventionPageForExternals } from "../pages/convention/ConventionPageForExternals";

type Routes = typeof routes;

const getPageByRouteName: {
  [K in keyof Routes]: (route: Route<Routes[K]>) => unknown;
} = {
  addAgency: () => <AddAgencyPage />,
  adminRoot: () => routes.adminTab({ tab: "conventions" }).replace(),
  adminTab: (route) => (
    <AdminPrivateRoute>
      <AdminPage route={route} />
    </AdminPrivateRoute>
  ),
  agencyDashboard: (route) => (
    <InclusionConnectedPrivateRoute route={route}>
      <AgencyDashboardPage />
    </InclusionConnectedPrivateRoute>
  ),
  conventionForUkraine: (route) => <ConventionPageForUkraine route={route} />,
  conventionImmersion: (route) => <ConventionImmersionPage route={route} />,
  conventionImmersionForExternals: (route) => (
    <ConventionPageForExternals route={route} />
  ),
  conventionMiniStage: (route) => <ConventionMiniStagePage route={route} />,
  conventionStatusDashboard: (route) => (
    <ConventionStatusDashboardPage route={route} />
  ),
  conventionToSign: (route) => <ConventionSignPage route={route} />,
  conventionToValidate: (route) => <ConventionValidatePage route={route} />,
  debugPopulateDB: () => undefined,
  editFormEstablishment: (route) => (
    <EstablishmentEditionFormPage route={route} />
  ),
  errorRedirect: (route) => <ErrorRedirectPage route={route} />,
  formEstablishment: (route) => <EstablishmentFormPage route={route} />,
  formEstablishmentForExternals: (route) => (
    <EstablishmentFormPageForExternals route={route} />
  ),
  home: () => <HomePage type="default" />,
  homeAgencies: () => <HomePage type="agency" />,
  homeCandidates: () => <HomePage type="candidate" />,
  homeEstablishments: () => <HomePage type="establishment" />,
  immersionAssessment: (route) => <ImmersionAssessmentPage route={route} />,
  renewConventionMagicLink: (route) => <RenewExpiredLinkPage route={route} />,
  search: (route) => <SearchPage route={route} />,
  standard: (route) =>
    standardPageSlugs.includes(route.params.pagePath as StandardPageSlugs) ? (
      <StandardLayout route={route} />
    ) : (
      <ErrorPage type="httpClientNotFoundError" />
    ),
  stats: () => <StatsPage />,
};

export const Router = () => {
  const route = useRoute();
  const routeName = route.name;

  return (
    <>
      {routeName === false ? (
        <ErrorPage type="httpClientNotFoundError" />
      ) : (
        getPageByRouteName[routeName](route as Route<unknown>)
      )}
    </>
  );
};
