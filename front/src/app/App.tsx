import React, { useLayoutEffect } from "react";
import { useDispatch } from "react-redux";
import { useFetchFeatureFlags } from "src/app/utils/useFeatureFlags";
import { ENV } from "src/environmentVariables";
import { Router } from "./routing/Router";
import { CrispChat } from "react-design-system/immersionFacile";
import { AppIsReadyAction } from "src/core-logic/domain/commonActions";

const useAppLoaded = () => {
  const dispatch = useDispatch();
  useLayoutEffect(() => {
    dispatch(AppIsReadyAction());
  }, []);
};

export const App = () => {
  useFetchFeatureFlags();
  useAppLoaded();

  return (
    <>
      <Router />
      {ENV.crispWebSiteId && <CrispChat crispWebsiteId={ENV.crispWebSiteId} />}
    </>
  );
};
