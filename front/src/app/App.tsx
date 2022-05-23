import React from "react";
import { useFetchFeatureFlags } from "src/app/utils/useFeatureFlags";
import { ENV } from "src/environmentVariables";
import { Navigation } from "./components/Navigation";
import { Router } from "./routing/Router";

const { frontEnvType } = ENV;

export const App = () => {
  useFetchFeatureFlags();

  return (
    <>
      {frontEnvType === "DEV" && <Navigation />}
      <Router />
    </>
  );
};
