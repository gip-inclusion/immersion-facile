import React, { useContext, useEffect, useState } from "react";
import { apiAdresseGateway, featureFlagsGateway } from "src/app/dependencies";
import { FeatureFlags } from "src/shared/featureFlags";

const defaultFeatureFlags: FeatureFlags = {
  enableAdminUi: false,
  enableByPassInseeApi: false,
};

export const useFetchFeatureFlags = () => {
  const [featureFlags, setFeatureFlags] =
    useState<FeatureFlags>(defaultFeatureFlags);

  useEffect(() => {
    featureFlagsGateway.getAll().then(setFeatureFlags);
  }, []);

  return featureFlags;
};

export const FeatureFlagsContext = React.createContext(defaultFeatureFlags);

export const useFeatureFlagsContext = () => {
  const featureFlagContext = useContext(FeatureFlagsContext);
  if (!featureFlagContext) {
    throw new Error(
      "usePostsContext must be used within the PostsContext.Provider",
    );
  }
  return featureFlagContext;
};
