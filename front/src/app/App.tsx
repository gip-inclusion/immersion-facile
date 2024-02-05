import React, { useLayoutEffect } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useDispatch } from "react-redux";
import { CrispChat } from "react-design-system";
import {
  ConsentBannerAndConsentManagement,
  useConsent,
} from "src/app/components/ConsentManager";
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
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => <ErrorPage message={error.message} />}
      resetKeys={[currentRoute]}
      onReset={() => {
        dispatch(rootAppSlice.actions.appResetRequested());
      }}
    >
      <ConsentBannerAndConsentManagement />
      <Router />
      {ENV.crispWebSiteId && (
        <CrispChat
          crispWebsiteId={ENV.crispWebSiteId}
          userConsent={!!consent?.finalityConsent?.support}
        />
      )}
      <MatomoTagManager containerUrl="https://matomo.inclusion.beta.gouv.fr/js/container_gXlljpZ7.js" />
    </ErrorBoundary>
  );
};
