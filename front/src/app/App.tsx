import { useLayoutEffect } from "react";
import { CrispChat } from "react-design-system";
import { ErrorBoundary } from "react-error-boundary";
import { useDispatch } from "react-redux";
import { ConsentManager, useConsent } from "src/app/components/ConsentManager";
import { useSetAcquisitionParams } from "src/app/hooks/acquisition.hooks";
import { useFetchFeatureFlags } from "src/app/hooks/useFeatureFlags";
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
  useSetAcquisitionParams();
  return (
    <ErrorBoundary
      fallbackRender={({ error }) => <ErrorPage error={error} />}
      resetKeys={[currentRoute]}
      onReset={() => {
        dispatch(rootAppSlice.actions.appResetRequested());
      }}
    >
      <ConsentManager />
      <Router />
      {ENV.crispWebSiteId && ENV.envType !== "local" && (
        <CrispChat
          crispWebsiteId={ENV.crispWebSiteId}
          userConsent={!!consent?.finalityConsent?.support}
        />
      )}
    </ErrorBoundary>
  );
};
