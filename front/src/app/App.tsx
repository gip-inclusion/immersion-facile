import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useFetchFeatureFlags } from "src/app/utils/useFeatureFlags";
import { adminSlice } from "src/core-logic/domain/admin/admin.slice";
import { Router } from "./routing/Router";

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
    </>
  );
};
