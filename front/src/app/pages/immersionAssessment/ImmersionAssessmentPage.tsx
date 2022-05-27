import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { routes } from "src/app/routing/routes";
import { useAppSelector } from "src/app/utils/reduxHooks";

import { conventionStateSelector } from "src/core-logic/domain/immersionConvention/immersionConvention.selectors";
import { immersionConventionSlice } from "src/core-logic/domain/immersionConvention/immersionConvention.slice";
import { FormAccordion } from "src/uiComponents/admin/FormAccordion";
import { Route } from "type-route";

type ImmersionAssessmentRoute = Route<typeof routes.immersionAssessment>;

interface ImmersionAssessmentProps {
  route: ImmersionAssessmentRoute;
}

const useImmersionApplication = (jwt: string) => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(
      immersionConventionSlice.actions.immersionConventionRequested(jwt),
    );
  }, []);
};

export const ImmersionAssessmentPage = ({
  route,
}: ImmersionAssessmentProps) => {
  useImmersionApplication(route.params.jwt);
  const { convention, isLoading, error } = useAppSelector(
    conventionStateSelector,
  );

  return (
    <>
      <h1>Bilan de l'immersion</h1>
      {isLoading && <div>IS LOADING...</div>}
      {error && <div>{error}</div>}
      {convention && <FormAccordion immersionApplication={convention} />}
    </>
  );
};
