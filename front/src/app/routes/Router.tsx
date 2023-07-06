import React from "react";
import { Route } from "type-route";
import { AdminPage } from "src/app/pages/admin/AdminPage";
import { AddAgencyPage } from "src/app/pages/agency/AddAgencyPage";
import { AgencyDashboardPage } from "src/app/pages/AgencyDashboardPage";
import { ConventionImmersionPage } from "src/app/pages/convention/ConventionImmersionPage";
import { ConventionMiniStagePage } from "src/app/pages/convention/ConventionMiniStagePage";
import { ConventionSignPage } from "src/app/pages/convention/ConventionSignPage";
import { ConventionStatusDashboardPage } from "src/app/pages/convention/ConventionStatusDashboardPage";
import { ErrorRedirectPage } from "src/app/pages/error/ErrorRedirectPage";
import { EstablishmentEditionFormPage } from "src/app/pages/establishment/EstablishmentEditionFormPage";
import { EstablishmentFormPageForExternals } from "src/app/pages/establishment/EstablishmentFormPageForExternals";
import { SearchPage } from "src/app/pages/search/SearchPage";
import { StatsPage } from "src/app/pages/StatsPage";
import { AdminPrivateRoute, LoginForm } from "src/app/routes/AdminPrivateRoute";
import { InclusionConnectedPrivateRoute } from "src/app/routes/InclusionConnectedPrivateRoute";
import { RenewExpiredLinkPage } from "src/app/routes/RenewExpiredLinkPage";
import { StandardLayout } from "../components/layout/StandardLayout";
import { ConventionCustomAgencyPage } from "../pages/convention/ConventionCustomAgencyPage";
import { ConventionDocumentPage } from "../pages/convention/ConventionDocumentPage";
import { ConventionManageAdminPage } from "../pages/convention/ConventionManageAdminPage";
import { ConventionManagePage } from "../pages/convention/ConventionManagePage";
import { ConventionPageForExternals } from "../pages/convention/ConventionPageForExternals";
import { ErrorPage } from "../pages/error/ErrorPage";
import { EstablishmentFormPage } from "../pages/establishment/EstablishmentFormPage";
import { GroupPage } from "../pages/group/GroupPage";
import { HomePage } from "../pages/home/HomePage";
import { ImmersionAssessmentPage } from "../pages/immersion-assessment/ImmersionAssessmentPage";
import { AdminTab, adminTabs } from "./routeParams/adminTabs";
import {
  AuthorizedGroupSlugs,
  authorizedGroupSlugs,
} from "./routeParams/establishmentGroups";
import {
  StandardPageSlugs,
  standardPageSlugs,
} from "./routeParams/standardPage";
import { routes, useRoute } from "./routes";

type Routes = typeof routes;

const getPageByRouteName: {
  [K in keyof Routes]: (route: Route<Routes[K]>) => unknown;
} = {
  addAgency: () => <AddAgencyPage />,
  adminRoot: () => <LoginForm />,
  adminTab: (route) =>
    adminTabs.includes(route.params.tab as AdminTab) ? (
      <AdminPrivateRoute>
        <AdminPage route={route} />
      </AdminPrivateRoute>
    ) : (
      <ErrorPage type="httpClientNotFoundError" />
    ),
  agencyDashboard: (route) => (
    <InclusionConnectedPrivateRoute route={route}>
      <AgencyDashboardPage />
    </InclusionConnectedPrivateRoute>
  ),
  conventionCustomAgency: () => <ConventionCustomAgencyPage />,
  conventionImmersion: (route) => <ConventionImmersionPage route={route} />,
  conventionImmersionForExternals: (route) => (
    <ConventionPageForExternals route={route} />
  ),
  conventionDocument: (route) => <ConventionDocumentPage route={route} />,
  conventionMiniStage: () => <ConventionMiniStagePage />,
  conventionStatusDashboard: (route) => (
    <ConventionStatusDashboardPage route={route} />
  ),
  conventionToSign: (route) => <ConventionSignPage route={route} />,
  debugPopulateDB: () => undefined,
  editFormEstablishment: () => <EstablishmentEditionFormPage />,
  errorRedirect: (route) => <ErrorRedirectPage route={route} />,
  formEstablishment: () => <EstablishmentFormPage />,
  formEstablishmentForExternals: (route) => (
    <EstablishmentFormPageForExternals route={route} />
  ),
  group: (route) =>
    authorizedGroupSlugs.includes(
      route.params.groupName as AuthorizedGroupSlugs,
    ) ? (
      <GroupPage route={route} />
    ) : (
      <ErrorPage type="httpClientNotFoundError" />
    ),
  home: () => <HomePage type="default" />,
  homeAgencies: () => <HomePage type="agency" />,
  homeCandidates: () => <HomePage type="candidate" />,
  homeEstablishments: () => <HomePage type="establishment" />,
  immersionAssessment: (route) => <ImmersionAssessmentPage route={route} />,
  manageConvention: (route) => <ConventionManagePage route={route} />,
  manageConventionAdmin: (route) => <ConventionManageAdminPage route={route} />,
  manageConventionOld: (route) => <ConventionManagePage route={route} />,
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
