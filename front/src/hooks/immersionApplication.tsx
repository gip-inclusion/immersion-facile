import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { immersionConventionSlice } from "src/core-logic/domain/immersionConvention/immersionConvention.slice";

export const useImmersionApplication = (jwt: string) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(
      immersionConventionSlice.actions.immersionConventionRequested(jwt),
    );
  }, []);
};
