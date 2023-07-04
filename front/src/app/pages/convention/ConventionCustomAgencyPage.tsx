import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Route } from "type-route";
import { MainWrapper } from "react-design-system";
import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { HeaderFooterLayout } from "src/app/components/layout/HeaderFooterLayout";
import { routes } from "src/app/routes/routes";
import { conventionSlice } from "src/core-logic/domain/convention/convention.slice";

export type ConventionCustomAgencyPageRoute = Route<
  typeof routes.conventionCustomAgency
>;

export const ConventionCustomAgencyPage = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(conventionSlice.actions.preselectedAgencyIdRequested());
  }, []);
  return (
    <HeaderFooterLayout>
      <MainWrapper layout="boxed">
        <ConventionForm internshipKind="immersion" mode="create" />
      </MainWrapper>
    </HeaderFooterLayout>
  );
};
