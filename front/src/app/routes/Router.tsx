import {
  lazy,
  type ReactElement,
  type ReactNode,
  useEffect,
  useRef,
} from "react";
import { PageHeader } from "react-design-system";
import { type AdminTabRouteName, adminTabRouteNames } from "shared";
import { AdminAgencyDetail } from "src/app/components/forms/agency/AdminAgencyDetail";
import { AgencyDetailForAgencyDashboard } from "src/app/components/forms/agency/AgencyDetailForAgencyDashboard";
import { AdminTabs } from "src/app/pages/admin/AdminTabs";
import { AdminUserDetail } from "src/app/pages/admin/AdminUserDetail";
import { AddAgencyPage } from "src/app/pages/agency/AddAgencyPage";
import { AgencyDashboardPage } from "src/app/pages/agency-dashboard/AgencyDashboardPage";
import { AdminPrivateRoute } from "src/app/pages/auth/AdminPrivateRoute";
import { ConnectedPrivateRoute } from "src/app/pages/auth/ConnectedPrivateRoute";
import { DashboardPrivateRoute } from "src/app/pages/auth/DashboardPrivateRoute";
import { RenewExpiredLinkPage } from "src/app/pages/auth/RenewExpiredLinkPage";
import { BeneficiaryDashboardPage } from "src/app/pages/beneficiary-dashboard/BeneficiaryDashboardPage";
import { AssessmentDocumentPage } from "src/app/pages/convention/AssessmentDocumentPage";
import { ConventionConfirmationPage } from "src/app/pages/convention/ConventionConfirmationPage";
import { ConventionImmersionPage } from "src/app/pages/convention/ConventionImmersionPage";
import { ConventionManageConnectedUserPage } from "src/app/pages/convention/ConventionManageConnectedUserPage";
import { ConventionMiniStagePage } from "src/app/pages/convention/ConventionMiniStagePage";
import { ConventionSignPage } from "src/app/pages/convention/ConventionSignPage";
import { ConventionStatusDashboardPage } from "src/app/pages/convention/ConventionStatusDashboardPage";
import { InitiateConventionPage } from "src/app/pages/convention/InitiateConventionPage";
import { frontErrors } from "src/app/pages/error/front-errors";
import { EstablishmentFormPageForExternals } from "src/app/pages/establishment/EstablishmentFormPageForExternals";
import { EstablishmentLeadRegistrationRejectedPage } from "src/app/pages/establishment/EstablishmentLeadRegistrationRejectedPage";
import { EstablishmentDashboardPage } from "src/app/pages/establishment-dashboard/EstablishmentDashboardPage";
import { StatsPage } from "src/app/pages/StatsPage";
import { SearchPage } from "src/app/pages/search/SearchPage";
import { MyProfile } from "src/app/pages/user/MyProfile";
import { RequestAgencyRegistrationPage } from "src/app/pages/user/RequestAgencyRegistrationPage";
import { store } from "src/config/dependencies";
import { connectedUserSlice } from "src/core-logic/domain/connected-user/connectedUser.slice";
import type { Route } from "type-route";
import { StandardLayout } from "../components/layout/StandardLayout";
import { ManageEstablishmentAdminPage } from "../pages/admin/ManageEstablishmentAdminPage";
import { AdminConventionDetail } from "../pages/convention/AdminConventionDetail";
import { ConventionDocumentPage } from "../pages/convention/ConventionDocumentPage";
import { ConventionManagePage } from "../pages/convention/ConventionManagePage";
import { ConventionPageForExternals } from "../pages/convention/ConventionPageForExternals";
import { ErrorPage } from "../pages/error/ErrorPage";
import { EstablishmentCreationFormPage } from "../pages/establishment/EstablishmentCreationFormPage";
import { GroupPage } from "../pages/group/GroupPage";
import { HomePage } from "../pages/home/HomePage";
import { AssessmentPage } from "../pages/immersion-assessment/AssessmentPage";
import { SearchResultPage } from "../pages/search/SearchResultPage";
import {
  type StandardPageSlugs,
  standardPageSlugs,
} from "./routeParams/standardPage";
import { routes, useRoute } from "./routes";

const OpenApiDocPage = lazy(
  () => import("src/app/pages/open-api-doc/OpenApiDocPage"),
);

type Routes = typeof routes;

const adminRoutes: {
  [K in AdminTabRouteName]: (route: Route<Routes[K]>) => ReactElement;
} = adminTabRouteNames.reduce(
  (acc, tabRouteName) => ({
    ...acc,
    [tabRouteName]: (route: Route<any>) => (
      <AdminPrivateRoute route={route}>
        <AdminTabs route={route} />
      </AdminPrivateRoute>
    ),
  }),

  {} as {
    [K in AdminTabRouteName]: (route: Route<Routes[K]>) => ReactElement;
  },
);

const RedirectTo = ({ route }: { route: Route<typeof routes> }) => {
  useEffect(() => {
    route.push();
  }, [route.push]);
  return null;
};

const getPageSideEffectByRouteName: Partial<Record<keyof Routes, () => void>> =
  {
    establishmentDashboard: () => {
      store.dispatch(
        connectedUserSlice.actions.currentUserFetchRequested({
          feedbackTopic: "unused",
        }),
      );
    },
    establishmentDashboardFormEstablishment: () => {
      store.dispatch(
        connectedUserSlice.actions.currentUserFetchRequested({
          feedbackTopic: "unused",
        }),
      );
    },
    establishmentDashboardDiscussions: () => {
      store.dispatch(
        connectedUserSlice.actions.currentUserFetchRequested({
          feedbackTopic: "unused",
        }),
      );
    },
    establishmentDashboardConventions: () => {
      store.dispatch(
        connectedUserSlice.actions.currentUserFetchRequested({
          feedbackTopic: "unused",
        }),
      );
    },
  };

const getPageByRouteName: {
  [K in keyof Routes]: (route: Route<Routes[K]>) => ReactNode;
} = {
  addAgency: () => <AddAgencyPage />,
  admin: (route) => (
    <AdminPrivateRoute route={routes.adminConventions(route.params)}>
      <AdminTabs route={routes.adminConventions(route.params)} />
    </AdminPrivateRoute>
  ),
  ...adminRoutes,
  adminConventionDetail: (route) => (
    <AdminPrivateRoute route={route}>
      <AdminConventionDetail route={route} />
    </AdminPrivateRoute>
  ),
  adminAgencyDetail: (route) => (
    <AdminPrivateRoute route={route}>
      <AdminAgencyDetail route={route} />
    </AdminPrivateRoute>
  ),
  adminUserDetail: (route) => (
    <AdminPrivateRoute route={route}>
      <AdminUserDetail route={route} />
    </AdminPrivateRoute>
  ),
  agencyDashboard: (route) => (
    <RedirectTo route={routes.agencyDashboardMain(route.params)} />
  ),
  agencyDashboardMain: (route) => (
    <DashboardPrivateRoute route={route}>
      <AgencyDashboardPage route={route} />
    </DashboardPrivateRoute>
  ),
  agencyDashboardOnboarding: (route) => (
    <DashboardPrivateRoute route={route}>
      <AgencyDashboardPage route={route} />
    </DashboardPrivateRoute>
  ),
  agencyDashboardSynchronisedConventions: (route) => (
    <DashboardPrivateRoute route={route}>
      <AgencyDashboardPage route={route} />
    </DashboardPrivateRoute>
  ),
  agencyDashboardAgencies: (route) => (
    <DashboardPrivateRoute route={route}>
      <AgencyDashboardPage route={route} />
    </DashboardPrivateRoute>
  ),
  agencyDashboardAgencyDetails: (route) => (
    <DashboardPrivateRoute route={route}>
      <AgencyDetailForAgencyDashboard route={route} />
    </DashboardPrivateRoute>
  ),
  assessmentDocument: (route) => <AssessmentDocumentPage route={route} />,
  beneficiaryDashboard: () => <BeneficiaryDashboardPage />,
  initiateConvention: () => <InitiateConventionPage />,
  conventionImmersion: (route) => <ConventionImmersionPage route={route} />,
  conventionMiniStage: (route) => <ConventionMiniStagePage route={route} />,
  conventionConfirmation: (route) => (
    <ConventionConfirmationPage route={route} />
  ),
  conventionImmersionForExternals: (route) => (
    <ConventionPageForExternals route={route} />
  ),
  conventionDocument: (route) => <ConventionDocumentPage route={route} />,
  conventionStatusDashboard: (route) => (
    <ConventionStatusDashboardPage route={route} />
  ),
  conventionToSign: (route) => <ConventionSignPage route={route} />,
  establishmentDashboard: (route) => (
    <RedirectTo
      route={routes.establishmentDashboardConventions(route.params)}
    />
  ),
  establishmentDashboardConventions: (route) => (
    <DashboardPrivateRoute route={route}>
      <EstablishmentDashboardPage route={route} />
    </DashboardPrivateRoute>
  ),
  establishmentDashboardFormEstablishment: (route) => (
    <DashboardPrivateRoute route={route}>
      <EstablishmentDashboardPage route={route} />
    </DashboardPrivateRoute>
  ),
  establishmentDashboardDiscussions: (route) => (
    <DashboardPrivateRoute route={route}>
      <EstablishmentDashboardPage route={route} />
    </DashboardPrivateRoute>
  ),
  formEstablishment: (route) => <EstablishmentCreationFormPage route={route} />,
  formEstablishmentForExternals: (route) => (
    <EstablishmentFormPageForExternals route={route} />
  ),
  group: (route) => <GroupPage route={route} />,
  home: () => <HomePage type="default" />,
  homeAgencies: () => <HomePage type="agency" />,
  homeCandidates: () => <HomePage type="candidate" />,
  homeEstablishments: () => <HomePage type="establishment" />,
  assessment: (route) => <AssessmentPage route={route} />,
  searchResult: () => <SearchResultPage />,
  searchResultForStudent: () => <SearchResultPage />,
  searchResultExternal: () => <SearchResultPage isExternal />,
  manageConvention: (route) => <ConventionManagePage route={route} />,
  manageConventionConnectedUser: (route) => (
    <ConventionManageConnectedUserPage route={route} />
  ),
  myProfile: (route) => (
    <ConnectedPrivateRoute
      route={route}
      oAuthConnexionPageHeader={
        <PageHeader title="Vous devez vous connecter pour accéder à votre profil" />
      }
    >
      <MyProfile route={route} />
    </ConnectedPrivateRoute>
  ),
  myProfileAgencyRegistration: () => <RequestAgencyRegistrationPage />,
  openApiDoc: () => <OpenApiDocPage />,
  manageEstablishmentAdmin: () => <ManageEstablishmentAdminPage />,
  renewConventionMagicLink: (route) => <RenewExpiredLinkPage route={route} />,
  search: (route) => (
    <SearchPage route={route} useNaturalLanguageForAppellations />
  ),
  searchForStudent: (route) => (
    <SearchPage route={route} useNaturalLanguageForAppellations />
  ),
  standard: (route) =>
    standardPageSlugs.includes(route.params.pagePath as StandardPageSlugs) ? (
      <StandardLayout route={route} />
    ) : (
      <ErrorPage error={frontErrors.generic.pageNotFound()} />
    ),
  stats: () => <StatsPage />,
  unregisterEstablishmentLead: (route) => (
    <EstablishmentLeadRegistrationRejectedPage route={route} />
  ),
};

export const Router = (): ReactNode => {
  const route = useRoute();
  const routeName = route.name;
  const previousRouteName = useRef<keyof Routes | undefined>(undefined);
  useEffect(() => {
    if (
      routeName &&
      previousRouteName.current !== routeName &&
      getPageSideEffectByRouteName[routeName]
    ) {
      previousRouteName.current = routeName;
      getPageSideEffectByRouteName[routeName]();
    }
  }, [routeName]);
  return routeName === false ? (
    <ErrorPage error={frontErrors.generic.pageNotFound()} />
  ) : (
    (getPageByRouteName[routeName](route as Route<unknown>) as ReactNode)
  );
};
