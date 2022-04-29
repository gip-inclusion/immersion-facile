import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";
import { ENV } from "src/environmentVariables";
import { Navigation } from "./components/Navigation";
import { Router } from "./routing/Router";

const { frontEnvType } = ENV;

const useFetchFeatureFlags = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(featureFlagsSlice.actions.retrieveFeatureFlagsRequested());
  }, []);
};

export const App = () => {
  useFetchFeatureFlags();

  return (
    <>
      {frontEnvType === "DEV" && <Navigation />}
      <Router />
    </>
  );
};
