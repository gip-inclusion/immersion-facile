import React from "react";
import {
  FeatureFlagsContext,
  useFetchFeatureFlags,
} from "./utils/FeatureFlagContext";
import { Navigation } from "./components/Navigation";
import { Router } from "./routing/Router";
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
