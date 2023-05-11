import React, { useLayoutEffect } from "react";
import { useDispatch } from "react-redux";
import { CrispChat, MaintenanceCallout } from "react-design-system";
import {
  useFeatureFlags,
  useFetchFeatureFlags,
} from "src/app/hooks/useFeatureFlags";
import { MatomoTagManager } from "src/app/MatomoTagManager";
import { ENV } from "src/config/environmentVariables";
import { appIsReadyAction } from "src/core-logic/domain/actions";
import { commonContent } from "./contents/commonContent";
import { Router } from "./routes/Router";

const useAppIsReady = () => {
  const dispatch = useDispatch();
  useLayoutEffect(() => {
    dispatch(appIsReadyAction());
  }, []);
};

export const App = () => {
  useFetchFeatureFlags();
  useAppIsReady();
  const { enableMaintenance } = useFeatureFlags();
  return (
    <>
      {enableMaintenance && (
        <MaintenanceCallout message={commonContent.maintenanceMessage} />
      )}
      <Router />
      {ENV.crispWebSiteId && <CrispChat crispWebsiteId={ENV.crispWebSiteId} />}

      <MatomoTagManager containerUrl="https://matomo.inclusion.beta.gouv.fr/js/container_gXlljpZ7.js" />
    </>
  );
};
