import React, { useLayoutEffect } from "react";
import { useDispatch } from "react-redux";
import { useFetchFeatureFlags } from "src/app/utils/useFeatureFlags";
import { ENV } from "src/environmentVariables";
import { Router } from "./routing/Router";
import { CrispChat } from "react-design-system/immersionFacile";
import { appIsReadyAction } from "src/core-logic/domain/actions";

const useAppIsReady = () => {
  const dispatch = useDispatch();
  useLayoutEffect(() => {
    dispatch(appIsReadyAction());
  }, []);
};

export const App = () => {
  useFetchFeatureFlags();
  useAppIsReady();

  return (
    <>
      <Router />
      {ENV.crispWebSiteId && <CrispChat crispWebsiteId={ENV.crispWebSiteId} />}
    </>
  );
};
