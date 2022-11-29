import React from "react";
import { ConventionForm } from "src/app/pages/Convention/ConventionForm";
import { ConventionFormContainerLayout } from "src/app/pages/Convention/ConventionFormContainerLayout";
import { conventionInitialValuesFromUrl } from "src/app/pages/Convention/conventionHelpers";
import { routes } from "src/app/routing/routes";
import { Route } from "type-route";

export type ConventionMiniStagePageRoute = Route<
  typeof routes.conventionMiniStage
>;

interface ConventionMiniStagePageProps {
  route: ConventionMiniStagePageRoute;
}

export const ConventionMiniStagePage = ({
  route,
}: ConventionMiniStagePageProps) => (
  <ConventionFormContainerLayout>
    <ConventionForm
      properties={conventionInitialValuesFromUrl({
        route,
        internshipKind: "mini-stage-cci",
      })}
      routeParams={route.params}
    />
  </ConventionFormContainerLayout>
);
