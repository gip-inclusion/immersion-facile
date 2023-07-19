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
import { featureFlagSelectors } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import { commonContent } from "./contents/commonContent";
import { useAppSelector } from "./hooks/reduxHooks";
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
  const maintenanceMessage = useAppSelector(
    featureFlagSelectors.maintenanceMessage,
  );
  return (
    <>
      {enableMaintenance.isActive && (
        <MaintenanceCallout
          message={
            maintenanceMessage || maintenanceMessage !== ""
              ? maintenanceMessage
              : commonContent.maintenanceMessage
          }
        />
      )}
      <Router />
      {ENV.crispWebSiteId && <CrispChat crispWebsiteId={ENV.crispWebSiteId} />}

      <MatomoTagManager containerUrl="https://matomo.inclusion.beta.gouv.fr/js/container_gXlljpZ7.js" />
    </>
  );
};
