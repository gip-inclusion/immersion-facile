import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useFetchFeatureFlags } from "src/app/utils/useFeatureFlags";
import { adminSlice } from "src/core-logic/domain/admin/admin.slice";
import { ENV } from "src/environmentVariables";
import { Navigation } from "./components/Navigation";
import { Router } from "./routing/Router";

const { frontEnvType } = ENV;

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
      {frontEnvType === "DEV" && <Navigation />}
      <Router />
    </>
  );
};
