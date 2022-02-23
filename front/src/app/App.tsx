import React from "react";
import {
  FeatureFlagsContext,
  useFetchFeatureFlags,
} from "src/app/FeatureFlagContext";
import { Navigation } from "src/app/Navigation";
import { Router } from "src/app/Router";
import { ENV } from "src/environmentVariables";

const { dev } = ENV;

export const App = () => {
  const featureFlags = useFetchFeatureFlags();

  return (
    <FeatureFlagsContext.Provider value={featureFlags}>
      {dev && <Navigation />}
      <Router />
    </FeatureFlagsContext.Provider>
  );
};
