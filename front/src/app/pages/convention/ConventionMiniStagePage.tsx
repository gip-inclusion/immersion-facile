import React from "react";
import { Route } from "type-route";
import { ConventionForm } from "src/app/components/forms/convention/ConventionForm";
import { ConventionFormContainerLayout } from "src/app/components/forms/convention/ConventionFormContainerLayout";
import { conventionInitialValuesFromUrl } from "src/app/components/forms/convention/conventionHelpers";
import { routes } from "src/app/routes/routes";

export type ConventionMiniStagePageRoute = Route<
  typeof routes.conventionMiniStage
>;

interface ConventionMiniStagePageProps {
  route: ConventionMiniStagePageRoute;
}

export const ConventionMiniStagePage = ({
  route,
}: ConventionMiniStagePageProps) => (
  <ConventionFormContainerLayout internshipKind="mini-stage-cci">
    <ConventionForm
      conventionProperties={conventionInitialValuesFromUrl({
        route,
        internshipKind: "mini-stage-cci",
      })}
      routeParams={route.params}
      mode="create"
    />
  </ConventionFormContainerLayout>
);
