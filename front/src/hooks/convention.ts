import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";

export const useConvention = (jwt: string) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(conventionSlice.actions.conventionRequested(jwt));
  }, []);
};
