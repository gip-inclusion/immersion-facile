import React, { useEffect } from "react";
import { MainWrapper } from "react-design-system";
import { useDispatch } from "react-redux";
import { ConventionFormWrapper } from "src/app/components/forms/convention/ConventionFormWrapper";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";
import { Route } from "type-route";

export type ConventionCustomAgencyPageRoute = Route<
  typeof routes.conventionCustomAgency
>;

export const ConventionCustomAgencyPage = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(conventionSlice.actions.preselectedAgencyIdRequested());
  }, [dispatch]);
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        <ConventionFormWrapper internshipKind="immersion" mode="create" />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
