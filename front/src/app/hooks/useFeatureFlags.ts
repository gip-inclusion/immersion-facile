import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useAppSelector } from "src/app/hooks/reduxHooks";
import { featureFlagSelectors } from "src/core-logic/domain/featureFlags/featureFlags.selector";
import { featureFlagsSlice } from "src/core-logic/domain/featureFlags/featureFlags.slice";

export const useFetchFeatureFlags = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(featureFlagsSlice.actions.retrieveFeatureFlagsRequested());
  }, []);
};

export const useFeatureFlags = () =>
  useAppSelector(featureFlagSelectors.featureFlagState);
