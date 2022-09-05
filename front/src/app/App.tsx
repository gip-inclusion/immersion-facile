import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useFetchFeatureFlags } from "src/app/utils/useFeatureFlags";
import { adminSlice } from "src/core-logic/domain/admin/admin.slice";
import { ENV } from "src/environmentVariables";
import { Router } from "./routing/Router";
import { CrispChat } from "react-design-system/immersionFacile";

const useCheckIfUserIsAdmin = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(adminSlice.actions.checkIfLoggedInRequested());
  }, []);
};

export const App = () => {
  useFetchFeatureFlags();
  useCheckIfUserIsAdmin();
  return (
    <>
      <Router />
      {ENV.crispWebSiteId && <CrispChat crispWebsiteId={ENV.crispWebSiteId} />}
    </>
  );
};
