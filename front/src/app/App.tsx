import { useLayoutEffect } from "react";
import { CrispChat } from "react-design-system";
import { ErrorBoundary } from "react-error-boundary";
import { useDispatch } from "react-redux";
import {
  ConsentBannerAndConsentManagement,
  useConsent,
} from "src/app/components/ConsentManager";
import { useSetAcquisitionParams } from "src/app/hooks/acquisition.hooks";
import { useFetchFeatureFlags } from "src/app/hooks/useFeatureFlags";
import { MatomoTagManager } from "src/app/MatomoTagManager";
import { ErrorPage } from "src/app/pages/error/ErrorPage";
import { useRoute } from "src/app/routes/routes";
import { ENV } from "src/config/environmentVariables";
import { rootAppSlice } from "src/core-logic/domain/rootApp/rootApp.slice";
import { Router } from "./routes/Router";

const useAppIsReady = () => {
  const dispatch = useDispatch();
  useLayoutEffect(() => {
    dispatch(rootAppSlice.actions.appIsReady());
  }, [dispatch]);
};

export const App = () => {
  useFetchFeatureFlags();
  useAppIsReady();
  const currentRoute = useRoute();
  const dispatch = useDispatch();
  const consent = useConsent();
  const matomoUrls: Record<typeof ENV.envType, string> = {
    local:
      "https://matomo.inclusion.beta.gouv.fr/js/container_gXlljpZ7_dev_d2e47aeaf37d823506115b8a.js",
    dev: "https://matomo.inclusion.beta.gouv.fr/js/container_gXlljpZ7_dev_d2e47aeaf37d823506115b8a.js",
    pentest:
      "https://matomo.inclusion.beta.gouv.fr/js/container_gXlljpZ7_pentest_a8b07fda200254c3602d860a.js",
    staging:
      "https://matomo.inclusion.beta.gouv.fr/js/container_gXlljpZ7_staging_60e68dc0e23bda19899cf43d.js",
    production:
      "https://matomo.inclusion.beta.gouv.fr/js/container_gXlljpZ7.js",
  };
  useSetAcquisitionParams();
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => <ErrorPage error={error} />}
      resetKeys={[currentRoute]}
      onReset={() => {
        dispatch(rootAppSlice.actions.appResetRequested());
      }}
    >
      <ConsentBannerAndConsentManagement />
      <Router />
      {ENV.crispWebSiteId && ENV.envType !== "local" && (
        <CrispChat
          crispWebsiteId={ENV.crispWebSiteId}
          userConsent={!!consent?.finalityConsent?.support}
        />
      )}
      <MatomoTagManager containerUrl={matomoUrls[ENV.envType]} />
    </ErrorBoundary>
  );
};
